
-- Create improved dealer post-auction processing functions
-- This will fix the current issues and add proper email notification triggers

-- First, create a robust function to process dealer post-seller decisions
CREATE OR REPLACE FUNCTION public.process_dealer_post_seller_decision()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_email_count INTEGER := 0;
  v_result jsonb;
  dealer_record RECORD;
BEGIN
  -- Update payment status for vehicles where seller has accepted
  UPDATE dealer_won_vehicles 
  SET payment_status = 'payment_required',
      updated_at = NOW()
  WHERE payment_status = 'awaiting_seller_decision'
    AND car_id IN (
      SELECT car_id 
      FROM seller_bid_decisions 
      WHERE decision = 'accepted'
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Get dealer records that need email notifications
  FOR dealer_record IN (
    SELECT 
      dwv.id as won_vehicle_id,
      dwv.dealer_id,
      dwv.car_id,
      dwv.winning_bid_amount,
      dwv.vehicle_make,
      dwv.vehicle_model,
      dwv.vehicle_year,
      d.dealership_name,
      p.id as user_id
    FROM dealer_won_vehicles dwv
    JOIN dealers d ON dwv.dealer_id = d.id
    JOIN profiles p ON d.user_id = p.id
    WHERE dwv.payment_status = 'payment_required'
      AND dwv.car_id IN (
        SELECT car_id 
        FROM seller_bid_decisions 
        WHERE decision = 'accepted'
      )
      -- Only send email if not already sent
      AND NOT EXISTS (
        SELECT 1 FROM system_logs 
        WHERE log_type = 'dealer_bid_accepted_email_sent' 
          AND details->>'won_vehicle_id' = dwv.id::text
      )
  ) LOOP
    
    -- Log that we're sending an email notification
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'dealer_bid_accepted_email_queued',
      'Queuing bid accepted email for dealer',
      jsonb_build_object(
        'won_vehicle_id', dealer_record.won_vehicle_id,
        'dealer_id', dealer_record.dealer_id,
        'car_id', dealer_record.car_id,
        'dealership_name', dealer_record.dealership_name,
        'vehicle', dealer_record.vehicle_year || ' ' || dealer_record.vehicle_make || ' ' || dealer_record.vehicle_model,
        'winning_bid', dealer_record.winning_bid_amount
      )
    );
    
    v_email_count := v_email_count + 1;
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object(
    'updated_payment_status_count', v_updated_count,
    'emails_queued', v_email_count,
    'timestamp', NOW(),
    'success', true
  );
  
  -- Log the operation
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'dealer_post_seller_decision_processing',
    'Processed dealer records after seller decisions',
    v_result
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'dealer_post_seller_decision_error',
    'Error processing dealer post-seller decisions',
    SQLERRM,
    jsonb_build_object('error_code', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$;

-- Improve the existing process_ended_auctions function with better error handling
CREATE OR REPLACE FUNCTION public.process_ended_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_won_vehicles_created INTEGER := 0;
  v_current_time TIMESTAMPTZ := NOW();
  auction_record RECORD;
  highest_bid_record RECORD;
  v_result jsonb;
BEGIN
  -- Log the start of processing
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'process_ended_auctions_start',
    'Starting to process ended auctions',
    jsonb_build_object('timestamp', v_current_time)
  );

  -- Find all ended auctions that haven't been processed yet
  FOR auction_record IN (
    SELECT 
      c.id as car_id, 
      c.seller_id, 
      c.auction_end_time, 
      c.reserve_price,
      c.make, 
      c.model, 
      c.year, 
      c.current_bid, 
      c.mileage, 
      c.images
    FROM cars c
    WHERE c.auction_status = 'ended'
      AND c.auction_end_time < v_current_time
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles 
        WHERE car_id = c.id
      )
    ORDER BY c.auction_end_time ASC
    LIMIT 50 -- Process in batches to avoid timeouts
  ) LOOP
    
    BEGIN -- Individual auction processing with error handling
      -- Get the highest bid for this auction
      SELECT 
        b.dealer_id, 
        b.amount, 
        b.id as bid_id,
        b.created_at
      INTO highest_bid_record
      FROM bids b
      WHERE b.car_id = auction_record.car_id
        AND b.status = 'active'
      ORDER BY b.amount DESC, b.created_at ASC
      LIMIT 1;
      
      -- Process if there's a winning bid that meets reserve
      IF highest_bid_record.amount IS NOT NULL AND 
         highest_bid_record.amount >= auction_record.reserve_price THEN
        
        -- Mark winning bid
        UPDATE bids 
        SET status = 'winning', updated_at = v_current_time
        WHERE car_id = auction_record.car_id 
          AND dealer_id = highest_bid_record.dealer_id
          AND amount = highest_bid_record.amount;

        -- Mark other bids as lost
        UPDATE bids 
        SET status = 'lost', updated_at = v_current_time
        WHERE car_id = auction_record.car_id 
          AND NOT (dealer_id = highest_bid_record.dealer_id AND amount = highest_bid_record.amount);

        -- Get second highest bid for fee calculation
        DECLARE
          v_second_highest_bid NUMERIC;
        BEGIN
          SELECT MAX(amount) INTO v_second_highest_bid
          FROM bids 
          WHERE car_id = auction_record.car_id 
            AND dealer_id != highest_bid_record.dealer_id 
            AND status IN ('active', 'lost');
        END;

        -- Create won vehicle record with "awaiting_seller_decision" status
        INSERT INTO dealer_won_vehicles (
          dealer_id,
          car_id,
          winning_bid_amount,
          original_bid_amount,
          second_highest_bid,
          platform_fee,
          auction_end_time,
          payment_status,
          seller_details_unlocked,
          vehicle_make,
          vehicle_model, 
          vehicle_year,
          vehicle_mileage,
          vehicle_images
        ) VALUES (
          highest_bid_record.dealer_id,
          auction_record.car_id,
          highest_bid_record.amount,
          highest_bid_record.amount,
          v_second_highest_bid,
          0, -- Platform fee calculated later
          auction_record.auction_end_time,
          'awaiting_seller_decision',
          false,
          auction_record.make,
          auction_record.model,
          auction_record.year,
          auction_record.mileage,
          CASE 
            WHEN auction_record.images IS NOT NULL THEN to_jsonb(auction_record.images)
            ELSE '[]'::jsonb
          END
        );

        -- Update car status
        UPDATE cars 
        SET current_bid = highest_bid_record.amount,
            auction_status = 'sold',
            awaiting_seller_decision = true,
            updated_at = v_current_time
        WHERE id = auction_record.car_id;

        v_won_vehicles_created := v_won_vehicles_created + 1;
        
        -- Log successful processing
        INSERT INTO system_logs (
          log_type, 
          message, 
          details
        ) VALUES (
          'dealer_won_vehicle_created',
          'Created dealer won vehicle record',
          jsonb_build_object(
            'car_id', auction_record.car_id,
            'dealer_id', highest_bid_record.dealer_id,
            'winning_bid', highest_bid_record.amount,
            'vehicle', auction_record.year || ' ' || auction_record.make || ' ' || auction_record.model
          )
        );
        
      ELSE
        -- No winning bid or reserve not met
        UPDATE bids 
        SET status = 'ended', updated_at = v_current_time
        WHERE car_id = auction_record.car_id AND status = 'active';

        -- Log no sale
        INSERT INTO system_logs (
          log_type, 
          message, 
          details
        ) VALUES (
          'auction_ended_no_sale',
          'Auction ended without sale',
          jsonb_build_object(
            'car_id', auction_record.car_id,
            'highest_bid', COALESCE(highest_bid_record.amount, 0),
            'reserve_price', auction_record.reserve_price,
            'vehicle', auction_record.year || ' ' || auction_record.make || ' ' || auction_record.model
          )
        );
      END IF;
      
      v_processed_count := v_processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log individual auction processing error but continue with others
      INSERT INTO system_logs (
        log_type, 
        message, 
        error_message,
        details
      ) VALUES (
        'individual_auction_processing_error',
        'Error processing individual auction',
        SQLERRM,
        jsonb_build_object(
          'car_id', auction_record.car_id,
          'error_code', SQLSTATE,
          'vehicle', auction_record.year || ' ' || auction_record.make || ' ' || auction_record.model
        )
      );
    END;
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object(
    'processed_auctions', v_processed_count,
    'won_vehicles_created', v_won_vehicles_created,
    'timestamp', v_current_time,
    'success', true
  );
  
  -- Log completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'process_ended_auctions_complete',
    'Completed processing ended auctions',
    v_result
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any function-level errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'process_ended_auctions_error',
    'Error in process_ended_auctions function',
    SQLERRM,
    jsonb_build_object('error_code', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', v_current_time
  );
END;
$$;

-- Create a trigger function to automatically process dealer records when seller decisions change
CREATE OR REPLACE FUNCTION public.trigger_dealer_post_seller_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process if decision was just made (changed from NULL to accepted/declined)
  IF (OLD.decision IS NULL OR OLD.decision != NEW.decision) AND NEW.decision = 'accepted' THEN
    -- Call the processing function asynchronously
    PERFORM public.process_dealer_post_seller_decision();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on seller_bid_decisions table
DROP TRIGGER IF EXISTS trigger_process_dealer_after_seller_decision ON seller_bid_decisions;
CREATE TRIGGER trigger_process_dealer_after_seller_decision
  AFTER UPDATE ON seller_bid_decisions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_dealer_post_seller_decision();

-- Add a scheduled function call to process any missed dealer records
SELECT cron.schedule(
  'process-dealer-post-seller-decisions',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT public.process_dealer_post_seller_decision();
  $$
);
