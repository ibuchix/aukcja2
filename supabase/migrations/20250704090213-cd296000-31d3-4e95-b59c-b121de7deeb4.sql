-- Phase 1: Manual Auction Processing for Ended Auctions
-- Process any ended auctions that haven't been processed yet

-- First, let's check and process the specific ended auction
-- Update auction schedules that should have ended
UPDATE auction_schedules 
SET status = 'completed'
WHERE status = 'running' 
  AND end_time < NOW();

-- Process ended auctions and create won vehicle records
DO $$
DECLARE
  auction_rec RECORD;
  highest_bid_rec RECORD;
  dealer_rec RECORD;
BEGIN
  -- Find ended auctions that haven't been processed
  FOR auction_rec IN 
    SELECT DISTINCT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
           c.make, c.model, c.year, c.current_bid
    FROM cars c
    LEFT JOIN auction_schedules sch ON sch.car_id = c.id
    WHERE (c.auction_status = 'active' OR c.auction_status IS NULL)
      AND c.auction_end_time < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv WHERE dwv.car_id = c.id
      )
  LOOP
    -- Get the highest bid for this car
    SELECT b.dealer_id, b.amount, b.id as bid_id
    INTO highest_bid_rec
    FROM bids b
    WHERE b.car_id = auction_rec.car_id
      AND b.status = 'active'
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;
    
    -- If there's a winning bid that meets or exceeds reserve price
    IF highest_bid_rec.amount IS NOT NULL AND highest_bid_rec.amount >= auction_rec.reserve_price THEN
      -- Get dealer info
      SELECT * INTO dealer_rec FROM dealers WHERE id = highest_bid_rec.dealer_id;
      
      -- Update car status to sold
      UPDATE cars 
      SET auction_status = 'sold', 
          status = 'sold',
          updated_at = NOW()
      WHERE id = auction_rec.car_id;
      
      -- Mark winning bid
      UPDATE bids 
      SET status = 'winning' 
      WHERE car_id = auction_rec.car_id 
        AND dealer_id = highest_bid_rec.dealer_id
        AND amount = highest_bid_rec.amount;
      
      -- Mark other bids as lost
      UPDATE bids 
      SET status = 'lost' 
      WHERE car_id = auction_rec.car_id 
        AND NOT (dealer_id = highest_bid_rec.dealer_id AND amount = highest_bid_rec.amount);
      
      -- Create won vehicle record
      INSERT INTO dealer_won_vehicles (
        dealer_id,
        car_id,
        winning_bid_amount,
        original_bid_amount,
        second_highest_bid,
        platform_fee,
        auction_end_time,
        payment_status,
        seller_details_unlocked
      ) 
      SELECT 
        highest_bid_rec.dealer_id,
        auction_rec.car_id,
        highest_bid_rec.amount,
        highest_bid_rec.amount,
        (SELECT MAX(amount) FROM bids 
         WHERE car_id = auction_rec.car_id 
           AND dealer_id != highest_bid_rec.dealer_id 
           AND status IN ('active', 'lost')),
        0, -- Platform fee will be calculated by the app
        auction_rec.auction_end_time,
        'pending',
        false;
      
      -- Create auction result record
      INSERT INTO auction_results (
        car_id,
        auction_id,
        highest_bid_dealer_id,
        final_price,
        sale_status,
        total_bids,
        unique_bidders,
        admin_review_status
      )
      SELECT 
        auction_rec.car_id,
        auction_rec.car_id,
        highest_bid_rec.dealer_id,
        highest_bid_rec.amount,
        'sold',
        (SELECT COUNT(*) FROM bids WHERE car_id = auction_rec.car_id),
        (SELECT COUNT(DISTINCT dealer_id) FROM bids WHERE car_id = auction_rec.car_id),
        'approved';
        
      RAISE NOTICE 'Processed auction for car % - Won by dealer % for %', 
        auction_rec.car_id, highest_bid_rec.dealer_id, highest_bid_rec.amount;
    ELSE
      -- No winning bid or didn't meet reserve
      UPDATE cars 
      SET auction_status = 'ended', 
          status = 'available',
          updated_at = NOW()
      WHERE id = auction_rec.car_id;
      
      -- Mark all bids as ended
      UPDATE bids 
      SET status = 'ended' 
      WHERE car_id = auction_rec.car_id AND status = 'active';
      
      RAISE NOTICE 'Auction ended without sale for car % - highest bid % vs reserve %', 
        auction_rec.car_id, COALESCE(highest_bid_rec.amount, 0), auction_rec.reserve_price;
    END IF;
  END LOOP;
END $$;

-- Phase 2: Fix Watchlist RLS Policy
-- Drop the problematic watchlist policy
DROP POLICY IF EXISTS "Allow users to manage their watchlist" ON public.dealer_watchlist;

-- Create proper RLS policies for dealer_watchlist
CREATE POLICY "Dealers can view their own watchlist" 
ON public.dealer_watchlist 
FOR SELECT 
USING (
  buyer_id IN (
    SELECT user_id FROM public.dealers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Dealers can insert into their watchlist" 
ON public.dealer_watchlist 
FOR INSERT 
WITH CHECK (
  buyer_id IN (
    SELECT user_id FROM public.dealers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Dealers can update their watchlist" 
ON public.dealer_watchlist 
FOR UPDATE 
USING (
  buyer_id IN (
    SELECT user_id FROM public.dealers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Dealers can delete from their watchlist" 
ON public.dealer_watchlist 
FOR DELETE 
USING (
  buyer_id IN (
    SELECT user_id FROM public.dealers WHERE user_id = auth.uid()
  )
);

-- Phase 3: Add RLS policy for dealer_won_vehicles so dealers can see their wins
CREATE POLICY "Dealers can view their own won vehicles" 
ON public.dealer_won_vehicles 
FOR SELECT 
USING (
  dealer_id IN (
    SELECT id FROM public.dealers WHERE user_id = auth.uid()
  )
);

-- Allow admins to manage won vehicles
CREATE POLICY "Admins can manage dealer won vehicles" 
ON public.dealer_won_vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);