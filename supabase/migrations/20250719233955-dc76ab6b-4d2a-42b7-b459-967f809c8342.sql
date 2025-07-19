
-- Remove strict bidding restrictions from place_bid function
-- Allow dealers to bid any positive amount regardless of current bid or reserve
CREATE OR REPLACE FUNCTION public.place_bid(p_car_id uuid, p_dealer_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_car_record RECORD;
    v_dealer_record RECORD;
    v_schedule_record RECORD;
    v_correlation_id text := gen_random_uuid()::text;
    v_auction_timing_status text;
BEGIN
    -- Enhanced logging for bid placement
    INSERT INTO system_logs (
        log_type, 
        message, 
        details,
        correlation_id
    ) VALUES (
        'bid_placement_start',
        'Enhanced bid placement initiated',
        jsonb_build_object(
            'car_id', p_car_id,
            'dealer_id', p_dealer_id,
            'amount', p_amount
        ),
        v_correlation_id
    );

    -- Validate inputs
    IF p_car_id IS NULL OR p_dealer_id IS NULL OR p_amount IS NULL THEN
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'Invalid input parameters',
            'Missing required parameters',
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing required parameters'
        );
    END IF;

    -- Basic amount validation - only check for positive values
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bid amount must be greater than 0'
        );
    END IF;

    -- Get comprehensive car information
    SELECT c.*, c.current_bid, c.minimum_bid_increment, c.reserve_price, c.auction_status
    INTO v_car_record
    FROM cars c
    WHERE c.id = p_car_id AND c.is_auction = true;

    IF NOT FOUND THEN
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'Car not found or not an auction',
            format('Car ID: %s', p_car_id),
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Car not found or not available for auction'
        );
    END IF;

    -- Get auction schedule information with enhanced validation
    SELECT s.*, 
           public.get_correct_auction_status(s.start_time, s.end_time, s.status) as calculated_status
    INTO v_schedule_record
    FROM auction_schedules s
    WHERE s.car_id = p_car_id;

    IF NOT FOUND THEN
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            details,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'No auction schedule found for car',
            'Auction schedule missing',
            jsonb_build_object(
                'car_id', p_car_id,
                'car_auction_status', v_car_record.auction_status
            ),
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Auction schedule not found'
        );
    END IF;

    -- Enhanced auction status validation with automatic correction
    v_auction_timing_status := public.get_correct_auction_status(
        v_schedule_record.start_time,
        v_schedule_record.end_time,
        v_schedule_record.status
    );

    -- Auto-correct status if there's a mismatch
    IF v_schedule_record.status::text != v_auction_timing_status THEN
        -- Only update if the new status is a valid enum value
        IF v_auction_timing_status IN ('scheduled', 'active', 'completed', 'cancelled') THEN
            UPDATE auction_schedules
            SET 
                status = v_auction_timing_status::auction_schedule_status,
                last_status_change = NOW()
            WHERE car_id = p_car_id;
        END IF;
    END IF;

    -- Check if auction is currently active (accepting bids)
    IF v_auction_timing_status != 'active' THEN
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            details,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'Auction is not currently accepting bids',
            format('Auction status: %s', v_auction_timing_status),
            jsonb_build_object(
                'car_id', p_car_id,
                'auction_status', v_auction_timing_status,
                'schedule_status', v_schedule_record.status::text,
                'start_time', v_schedule_record.start_time,
                'end_time', v_schedule_record.end_time,
                'current_time', NOW()
            ),
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Auction is not currently active. Status: %s', v_auction_timing_status)
        );
    END IF;

    -- Validate dealer
    SELECT d.* INTO v_dealer_record
    FROM dealers d
    WHERE d.id = p_dealer_id AND d.is_verified = true;

    IF NOT FOUND THEN
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'Dealer not found or not verified',
            format('Dealer ID: %s', p_dealer_id),
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Dealer not found or not verified'
        );
    END IF;

    -- Begin transaction for bid placement
    BEGIN
        -- Mark previous bids as outbid only if this bid is actually higher
        IF p_amount > COALESCE(v_car_record.current_bid, 0) THEN
            UPDATE bids 
            SET status = 'outbid', updated_at = NOW()
            WHERE car_id = p_car_id AND status = 'active';
        END IF;

        -- Insert new bid (always allow, regardless of amount)
        INSERT INTO bids (car_id, dealer_id, amount, status, created_at, updated_at)
        VALUES (p_car_id, p_dealer_id, p_amount, 'active', NOW(), NOW());

        -- Update car's current bid only if this bid is higher
        IF p_amount > COALESCE(v_car_record.current_bid, 0) THEN
            UPDATE cars 
            SET current_bid = p_amount, updated_at = NOW()
            WHERE id = p_car_id;
        END IF;

        -- Log successful bid placement
        INSERT INTO system_logs (
            log_type, 
            message, 
            details,
            correlation_id
        ) VALUES (
            'bid_placement_success',
            'Bid placed successfully',
            jsonb_build_object(
                'car_id', p_car_id,
                'dealer_id', p_dealer_id,
                'amount', p_amount,
                'previous_bid', COALESCE(v_car_record.current_bid, 0),
                'dealership_name', v_dealer_record.dealership_name,
                'is_higher_bid', p_amount > COALESCE(v_car_record.current_bid, 0)
            ),
            v_correlation_id
        );

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Bid placed successfully',
            'bid_amount', p_amount,
            'previous_bid', COALESCE(v_car_record.current_bid, 0),
            'is_highest', p_amount > COALESCE(v_car_record.current_bid, 0)
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log bid placement failure
        INSERT INTO system_logs (
            log_type, 
            message, 
            error_message,
            details,
            correlation_id
        ) VALUES (
            'bid_placement_error',
            'Failed to place bid',
            SQLERRM,
            jsonb_build_object(
                'car_id', p_car_id,
                'dealer_id', p_dealer_id,
                'amount', p_amount,
                'error_code', SQLSTATE
            ),
            v_correlation_id
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Failed to place bid: %s', SQLERRM)
        );
    END;
END;
$$;
