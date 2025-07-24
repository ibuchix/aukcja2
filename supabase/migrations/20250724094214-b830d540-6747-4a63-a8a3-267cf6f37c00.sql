-- Drop and recreate the function with proper auction detection logic
DROP FUNCTION IF EXISTS process_ended_auctions_securely();

CREATE OR REPLACE FUNCTION process_ended_auctions_securely()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    now_timestamp timestamptz := NOW();
    ended_auctions_count integer := 0;
    processed_auctions_count integer := 0;
    auction_record record;
    bid_record record;
    winning_bid_id uuid;
    winning_dealer_id uuid;
    winning_amount numeric;
    original_amount numeric;
    second_highest_amount numeric;
    platform_fee_amount numeric := 0;
    result jsonb;
BEGIN
    -- Log function start
    RAISE LOG 'Starting process_ended_auctions_securely at %', now_timestamp;
    
    -- Find ended auctions that need processing
    FOR auction_record IN 
        SELECT c.id, c.title, c.make, c.model, c.year, c.mileage, c.auction_end_time, 
               c.reserve_price, c.images, c.seller_id, c.current_bid
        FROM cars c
        WHERE c.is_auction = true
          AND c.auction_end_time < now_timestamp
          AND c.id NOT IN (SELECT dwv.car_id FROM dealer_won_vehicles dwv WHERE dwv.car_id = c.id)
          AND c.auction_end_time > now_timestamp - INTERVAL '30 days'  -- Only process recent auctions
        ORDER BY c.auction_end_time DESC
    LOOP
        ended_auctions_count := ended_auctions_count + 1;
        RAISE LOG 'Processing auction: % - % % % (Reserve: %, End: %)', 
            auction_record.id, auction_record.year, auction_record.make, 
            auction_record.model, auction_record.reserve_price, auction_record.auction_end_time;
        
        -- Get all bids for this auction ordered by amount DESC, then created_at ASC for proxy logic
        SELECT 
            b1.id, b1.dealer_id, b1.amount,
            (SELECT b2.amount FROM bids b2 WHERE b2.car_id = auction_record.id AND b2.amount < b1.amount ORDER BY b2.amount DESC, b2.created_at ASC LIMIT 1) as second_highest
        INTO bid_record
        FROM bids b1 
        WHERE b1.car_id = auction_record.id 
        ORDER BY b1.amount DESC, b1.created_at ASC 
        LIMIT 1;
        
        IF NOT FOUND THEN
            -- No bids - mark as ended
            RAISE LOG 'No bids found for auction %, marking as ended', auction_record.id;
            
            UPDATE cars 
            SET auction_status = 'ended', 
                status = 'ended',
                updated_at = now_timestamp
            WHERE id = auction_record.id;
            
            UPDATE bids 
            SET status = 'ended' 
            WHERE car_id = auction_record.id;
            
            processed_auctions_count := processed_auctions_count + 1;
            CONTINUE;
        END IF;
        
        winning_bid_id := bid_record.id;
        winning_dealer_id := bid_record.dealer_id;
        original_amount := bid_record.amount;
        second_highest_amount := bid_record.second_highest;
        
        RAISE LOG 'Highest bid: % (dealer: %), Second highest: %, Reserve: %', 
            original_amount, winning_dealer_id, second_highest_amount, auction_record.reserve_price;
        
        -- Check if reserve price is met
        IF original_amount >= auction_record.reserve_price THEN
            -- Apply proxy bidding logic
            IF second_highest_amount IS NOT NULL THEN
                IF (original_amount - second_highest_amount) > 250 THEN
                    winning_amount := second_highest_amount + 250;
                    RAISE LOG 'Proxy bidding: reducing % to % (second highest + 250)', 
                        original_amount, winning_amount;
                ELSE
                    winning_amount := original_amount;
                    RAISE LOG 'Proxy bidding: keeping original amount % (difference <= 250)', 
                        original_amount;
                END IF;
            ELSE
                winning_amount := original_amount;
                RAISE LOG 'Proxy bidding: keeping original amount % (no second bid)', 
                    original_amount;
            END IF;
            
            -- Calculate platform fee based on winning amount
            CASE 
                WHEN winning_amount < 5000 THEN platform_fee_amount := 600;
                WHEN winning_amount < 10000 THEN platform_fee_amount := 700;
                WHEN winning_amount < 20000 THEN platform_fee_amount := 800;
                WHEN winning_amount < 30000 THEN platform_fee_amount := 900;
                WHEN winning_amount < 40000 THEN platform_fee_amount := 1000;
                WHEN winning_amount < 50000 THEN platform_fee_amount := 1100;
                WHEN winning_amount < 60000 THEN platform_fee_amount := 1200;
                WHEN winning_amount < 70000 THEN platform_fee_amount := 1300;
                WHEN winning_amount < 80000 THEN platform_fee_amount := 1400;
                WHEN winning_amount < 90000 THEN platform_fee_amount := 1500;
                WHEN winning_amount < 100000 THEN platform_fee_amount := 1600;
                WHEN winning_amount < 125000 THEN platform_fee_amount := 1700;
                WHEN winning_amount < 150000 THEN platform_fee_amount := 1800;
                WHEN winning_amount < 175000 THEN platform_fee_amount := 1900;
                WHEN winning_amount < 200000 THEN platform_fee_amount := 2050;
                WHEN winning_amount < 225000 THEN platform_fee_amount := 2150;
                WHEN winning_amount < 250000 THEN platform_fee_amount := 2250;
                WHEN winning_amount < 300000 THEN platform_fee_amount := 2550;
                WHEN winning_amount < 350000 THEN platform_fee_amount := 2650;
                WHEN winning_amount < 400000 THEN platform_fee_amount := 2750;
                WHEN winning_amount < 500000 THEN platform_fee_amount := 2850;
                ELSE platform_fee_amount := 3150;
            END CASE;
            
            RAISE LOG 'Platform fee for amount %: %', winning_amount, platform_fee_amount;
            
            -- Update car as sold
            UPDATE cars 
            SET auction_status = 'sold',
                status = 'sold', 
                current_bid = winning_amount,
                updated_at = now_timestamp
            WHERE id = auction_record.id;
            
            -- Update bid statuses
            UPDATE bids 
            SET status = 'winning' 
            WHERE id = winning_bid_id;
            
            UPDATE bids 
            SET status = 'lost' 
            WHERE car_id = auction_record.id AND id != winning_bid_id;
            
            -- Create dealer won vehicle record
            INSERT INTO dealer_won_vehicles (
                dealer_id,
                car_id,
                auction_end_time,
                winning_bid_amount,
                original_bid_amount,
                second_highest_bid,
                platform_fee,
                payment_status,
                vehicle_make,
                vehicle_model,
                vehicle_year,
                vehicle_mileage,
                vehicle_images
            ) VALUES (
                winning_dealer_id,
                auction_record.id,
                auction_record.auction_end_time,
                winning_amount,
                original_amount,
                second_highest_amount,
                platform_fee_amount,
                'payment_required',
                auction_record.make,
                auction_record.model,
                auction_record.year,
                auction_record.mileage,
                COALESCE(auction_record.images, '[]'::jsonb)
            );
            
            RAISE LOG 'Created dealer_won_vehicles record for car % with winning amount %', 
                auction_record.id, winning_amount;
            
        ELSE
            -- Reserve not met - mark as ended
            RAISE LOG 'Reserve price not met for auction % (% < %), marking as ended', 
                auction_record.id, original_amount, auction_record.reserve_price;
                
            UPDATE cars 
            SET auction_status = 'ended',
                status = 'ended', 
                updated_at = now_timestamp
            WHERE id = auction_record.id;
            
            UPDATE bids 
            SET status = 'ended' 
            WHERE car_id = auction_record.id;
        END IF;
        
        processed_auctions_count := processed_auctions_count + 1;
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'timestamp', now_timestamp,
        'ended_auctions', ended_auctions_count,
        'processed_auctions', processed_auctions_count
    );
    
    RAISE LOG 'Completed processing. Result: %', result;
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in process_ended_auctions_securely: % %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', now_timestamp,
        'ended_auctions', ended_auctions_count,
        'processed_auctions', processed_auctions_count
    );
END;
$$;