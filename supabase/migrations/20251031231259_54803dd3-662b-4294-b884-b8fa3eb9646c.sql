-- =====================================================
-- REFINED IMAGE ACCESS CONTROL FOR DEALERS
-- =====================================================
-- Active auctions: Dealers CAN see images
-- Scheduled auctions: Dealers CANNOT see images
-- Won vehicles: Dealers CAN see images (immediately, no payment check)
-- Lost/ended auctions: Dealers CANNOT see images
-- =====================================================

-- =====================================================
-- STEP 1: UPDATE RLS POLICIES ON car_file_uploads
-- =====================================================

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Verified dealers can view auction car images" ON car_file_uploads;

-- Policy 1: Active auction images only
CREATE POLICY "Dealers can view active auction car images"
ON car_file_uploads
FOR SELECT
TO public
USING (
  -- Must be a verified dealer
  EXISTS (
    SELECT 1
    FROM dealers d
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
  )
  -- Car must be in an ACTIVE auction only
  AND EXISTS (
    SELECT 1
    FROM cars c
    INNER JOIN auction_schedules asch ON c.id = asch.car_id
    WHERE c.id = car_file_uploads.car_id
      AND c.is_auction = true
      AND asch.status = 'active'
  )
);

-- Policy 2: Won vehicle images (immediate access, no payment check)
CREATE POLICY "Dealers can view won vehicle images"
ON car_file_uploads
FOR SELECT
TO public
USING (
  -- Must be a verified dealer who won this car
  EXISTS (
    SELECT 1
    FROM dealer_won_vehicles dwv
    INNER JOIN dealers d ON dwv.dealer_id = d.id
    WHERE dwv.car_id = car_file_uploads.car_id
      AND d.user_id = auth.uid()
      AND d.is_verified = true
  )
);

-- =====================================================
-- STEP 2: UPDATE get_car_images_for_dealers() RPC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_car_images_for_dealers(p_car_ids uuid[])
RETURNS SETOF car_file_uploads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cfu.*
  FROM car_file_uploads cfu
  WHERE cfu.car_id = ANY(p_car_ids)
    AND cfu.upload_status = 'completed'
    AND (
      -- Active auction images
      EXISTS (
        SELECT 1
        FROM cars c
        INNER JOIN auction_schedules asch ON c.id = asch.car_id
        WHERE c.id = cfu.car_id
          AND c.is_auction = true
          AND asch.status = 'active'
      )
      -- OR won vehicle images (dealer who won this car)
      OR EXISTS (
        SELECT 1
        FROM dealer_won_vehicles dwv
        INNER JOIN dealers d ON dwv.dealer_id = d.id
        WHERE dwv.car_id = cfu.car_id
          AND d.user_id = auth.uid()
          AND d.is_verified = true
      )
    )
  ORDER BY cfu.car_id, cfu.category, cfu.display_order;
END;
$$;

-- =====================================================
-- STEP 3: UPDATE STORAGE BUCKET POLICIES
-- =====================================================

-- Drop existing broad policy if exists
DROP POLICY IF EXISTS "Verified dealers can view auction car images from manual valuations" ON storage.objects;

-- Create targeted policy for manual-valuation-photos bucket
CREATE POLICY "Dealers can view active auction images from manual valuations"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'manual-valuation-photos'
  -- Verified dealer
  AND EXISTS (
    SELECT 1
    FROM dealers d
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
  )
  -- Image is from active auction OR won vehicle
  AND EXISTS (
    SELECT 1
    FROM car_file_uploads cfu
    WHERE cfu.file_path = name
      AND (
        -- Active auction
        EXISTS (
          SELECT 1
          FROM cars c
          INNER JOIN auction_schedules asch ON c.id = asch.car_id
          WHERE c.id = cfu.car_id
            AND c.is_auction = true
            AND asch.status = 'active'
        )
        -- OR won vehicle
        OR EXISTS (
          SELECT 1
          FROM dealer_won_vehicles dwv
          INNER JOIN dealers d2 ON dwv.dealer_id = d2.id
          WHERE dwv.car_id = cfu.car_id
            AND d2.user_id = auth.uid()
        )
      )
  )
);

-- =====================================================
-- STEP 4: POPULATE vehicle_images SNAPSHOT ON WIN
-- =====================================================

-- Update process_auction_end() to capture image snapshot
CREATE OR REPLACE FUNCTION process_auction_end()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count integer := 0;
  v_auction_record RECORD;
  v_winning_bid RECORD;
  v_second_highest_bid numeric;
  v_final_price numeric;
  v_platform_fee numeric;
  v_image_snapshot jsonb;
BEGIN
  -- Process all ended auctions that haven't been processed yet
  FOR v_auction_record IN
    SELECT 
      asch.id as schedule_id,
      asch.car_id,
      asch.status,
      asch.end_time,
      c.reserve_price
    FROM auction_schedules asch
    INNER JOIN cars c ON asch.car_id = c.id
    WHERE asch.status = 'active'
      AND asch.end_time <= NOW()
      AND NOT EXISTS (
        SELECT 1 
        FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = asch.car_id
      )
    FOR UPDATE OF asch
  LOOP
    -- Get highest bid
    SELECT b.dealer_id, b.bid_amount, b.is_proxy_bid, b.proxy_max_amount
    INTO v_winning_bid
    FROM bids b
    WHERE b.car_id = v_auction_record.car_id
    ORDER BY b.bid_amount DESC, b.created_at ASC
    LIMIT 1;

    -- Only process if reserve met
    IF v_winning_bid.bid_amount >= v_auction_record.reserve_price THEN
      -- Get second highest bid for proxy logic
      SELECT COALESCE(MAX(b.bid_amount), 0)
      INTO v_second_highest_bid
      FROM bids b
      WHERE b.car_id = v_auction_record.car_id
        AND b.dealer_id != v_winning_bid.dealer_id;

      -- Calculate final price (proxy logic: 250 PLN above second highest)
      IF v_second_highest_bid > 0 THEN
        v_final_price := v_second_highest_bid + 250;
        -- Ensure final price doesn't exceed winning bid
        IF v_final_price > v_winning_bid.bid_amount THEN
          v_final_price := v_winning_bid.bid_amount;
        END IF;
      ELSE
        -- No other bids, winner pays their bid
        v_final_price := v_winning_bid.bid_amount;
      END IF;

      -- Calculate platform fee based on winning bid range
      v_platform_fee := CASE
        WHEN v_final_price < 5000 THEN 600
        WHEN v_final_price < 10000 THEN 700
        WHEN v_final_price < 20000 THEN 800
        WHEN v_final_price < 30000 THEN 900
        WHEN v_final_price < 40000 THEN 1000
        WHEN v_final_price < 50000 THEN 1100
        WHEN v_final_price < 60000 THEN 1200
        WHEN v_final_price < 70000 THEN 1300
        WHEN v_final_price < 80000 THEN 1400
        WHEN v_final_price < 90000 THEN 1500
        WHEN v_final_price < 100000 THEN 1600
        WHEN v_final_price < 125000 THEN 1700
        WHEN v_final_price < 150000 THEN 1800
        WHEN v_final_price < 175000 THEN 1900
        WHEN v_final_price < 200000 THEN 2050
        WHEN v_final_price < 225000 THEN 2150
        WHEN v_final_price < 250000 THEN 2250
        WHEN v_final_price < 300000 THEN 2550
        WHEN v_final_price < 350000 THEN 2650
        WHEN v_final_price < 400000 THEN 2750
        WHEN v_final_price < 500000 THEN 2850
        ELSE 3150
      END;

      -- Capture image snapshot at moment of win
      SELECT jsonb_agg(
        jsonb_build_object(
          'file_path', cfu.file_path,
          'category', cfu.category,
          'display_order', cfu.display_order
        ) ORDER BY cfu.category, cfu.display_order
      )
      INTO v_image_snapshot
      FROM car_file_uploads cfu
      WHERE cfu.car_id = v_auction_record.car_id
        AND cfu.upload_status = 'completed';

      -- Create won vehicle record with snapshot
      INSERT INTO dealer_won_vehicles (
        dealer_id,
        car_id,
        auction_schedule_id,
        winning_bid_amount,
        final_purchase_price,
        platform_fee,
        payment_status,
        vehicle_images
      ) VALUES (
        v_winning_bid.dealer_id,
        v_auction_record.car_id,
        v_auction_record.schedule_id,
        v_winning_bid.bid_amount,
        v_final_price,
        v_platform_fee,
        'pending',
        COALESCE(v_image_snapshot, '[]'::jsonb)
      );

      -- Update auction schedule status
      UPDATE auction_schedules
      SET status = 'ended'
      WHERE id = v_auction_record.schedule_id;

      v_processed_count := v_processed_count + 1;
    ELSE
      -- Reserve not met, just mark as ended
      UPDATE auction_schedules
      SET status = 'ended'
      WHERE id = v_auction_record.schedule_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed_count', v_processed_count
  );
END;
$$;

-- =====================================================
-- STEP 5: UPDATE RLS POLICIES ON cars TABLE
-- =====================================================

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Verified dealers can view all cars" ON cars;

-- Policy 1: Active auction cars
CREATE POLICY "Dealers can view active auction cars"
ON cars
FOR SELECT
TO public
USING (
  is_auction = true
  AND EXISTS (
    SELECT 1
    FROM auction_schedules asch
    WHERE asch.car_id = cars.id
      AND asch.status = 'active'
  )
  AND EXISTS (
    SELECT 1
    FROM dealers d
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
  )
);

-- Policy 2: Won vehicles (keep existing one if it exists, or create it)
DROP POLICY IF EXISTS "Dealers can view won vehicles" ON cars;
CREATE POLICY "Dealers can view won vehicles"
ON cars
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM dealer_won_vehicles dwv
    INNER JOIN dealers d ON dwv.dealer_id = d.id
    WHERE dwv.car_id = cars.id
      AND d.user_id = auth.uid()
      AND d.is_verified = true
  )
);

-- Policy 3: Cars being bid on (allows dealers to see ended auctions they participated in)
CREATE POLICY "Dealers can view cars they bid on"
ON cars
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM bids b
    INNER JOIN dealers d ON b.dealer_id = d.id
    WHERE b.car_id = cars.id
      AND d.user_id = auth.uid()
      AND d.is_verified = true
  )
);

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_car_images_for_dealers(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION process_auction_end() TO authenticated;