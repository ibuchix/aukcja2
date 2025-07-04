-- Fix the core issues: Watchlist RLS and Won Vehicles RLS
-- Then manually process the specific ended auction

-- Phase 1: Fix Watchlist RLS Policy
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

-- Phase 2: Add RLS policy for dealer_won_vehicles so dealers can see their wins
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

-- Phase 3: Create a function to safely process ended auctions
CREATE OR REPLACE FUNCTION process_specific_ended_auction(p_car_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auction_rec RECORD;
  highest_bid_rec RECORD;
  result JSONB := '{"processed": false}'::jsonb;
BEGIN
  -- Get auction details
  SELECT c.id as car_id, c.seller_id, c.auction_end_time, c.reserve_price,
         c.make, c.model, c.year, c.current_bid, c.auction_status
  INTO auction_rec
  FROM cars c
  WHERE c.id = p_car_id;

  -- Check if auction exists and has ended
  IF auction_rec.car_id IS NULL THEN
    RETURN '{"error": "Car not found"}'::jsonb;
  END IF;

  IF auction_rec.auction_end_time > NOW() THEN
    RETURN '{"error": "Auction has not ended yet"}'::jsonb;
  END IF;

  -- Check if already processed
  IF EXISTS (SELECT 1 FROM dealer_won_vehicles WHERE car_id = p_car_id) THEN
    RETURN '{"error": "Auction already processed"}'::jsonb;
  END IF;

  -- Get the highest bid
  SELECT b.dealer_id, b.amount, b.id as bid_id
  INTO highest_bid_rec
  FROM bids b
  WHERE b.car_id = p_car_id
    AND b.status = 'active'
  ORDER BY b.amount DESC, b.created_at ASC
  LIMIT 1;

  -- Process if there's a winning bid that meets reserve
  IF highest_bid_rec.amount IS NOT NULL AND highest_bid_rec.amount >= auction_rec.reserve_price THEN
    -- Mark winning bid
    UPDATE bids 
    SET status = 'winning' 
    WHERE car_id = p_car_id 
      AND dealer_id = highest_bid_rec.dealer_id
      AND amount = highest_bid_rec.amount;

    -- Mark other bids as lost
    UPDATE bids 
    SET status = 'lost' 
    WHERE car_id = p_car_id 
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
    ) VALUES (
      highest_bid_rec.dealer_id,
      p_car_id,
      highest_bid_rec.amount,
      highest_bid_rec.amount,
      (SELECT MAX(amount) FROM bids 
       WHERE car_id = p_car_id 
         AND dealer_id != highest_bid_rec.dealer_id 
         AND status IN ('active', 'lost')),
      0,
      auction_rec.auction_end_time,
      'pending',
      false
    );

    -- Update car status manually (avoid triggers)
    UPDATE cars 
    SET current_bid = highest_bid_rec.amount,
        updated_at = NOW()
    WHERE id = p_car_id;

    result := jsonb_build_object(
      'processed', true,
      'car_id', p_car_id,
      'winning_bid', highest_bid_rec.amount,
      'dealer_id', highest_bid_rec.dealer_id
    );
  ELSE
    -- Mark all bids as ended
    UPDATE bids 
    SET status = 'ended' 
    WHERE car_id = p_car_id AND status = 'active';

    result := jsonb_build_object(
      'processed', true,
      'car_id', p_car_id,
      'result', 'no_sale',
      'highest_bid', COALESCE(highest_bid_rec.amount, 0),
      'reserve_price', auction_rec.reserve_price
    );
  END IF;

  RETURN result;
END;
$$;