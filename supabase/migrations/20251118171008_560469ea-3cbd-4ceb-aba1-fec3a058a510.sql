-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_car_images_for_dealers(uuid[]);

-- Recreate with proper authorization checks
CREATE OR REPLACE FUNCTION public.get_car_images_for_dealers(p_car_ids uuid[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_json JSONB;
  v_user_id uuid;
  v_dealer_id uuid;
  v_is_verified boolean;
BEGIN
  -- 1. Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- 2. Verify user is a verified dealer
  SELECT d.id, d.is_verified
  INTO v_dealer_id, v_is_verified
  FROM dealers d
  WHERE d.user_id = v_user_id;
  
  IF v_dealer_id IS NULL THEN
    RAISE EXCEPTION 'Dealer profile not found';
  END IF;
  
  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Dealer verification required';
  END IF;
  
  -- 3. Build JSON array of images, but ONLY for cars this dealer can access:
  --    - Cars in active auction
  --    - OR cars won by this dealer
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', cfu.id,
        'car_id', cfu.car_id,
        'file_path', cfu.file_path,
        'category', cfu.category,
        'display_order', cfu.display_order,
        'file_type', cfu.file_type,
        'upload_status', cfu.upload_status,
        'created_at', cfu.created_at
      )
      ORDER BY cfu.car_id, cfu.category, cfu.display_order
    ),
    '[]'::json
  )::jsonb
  INTO result_json
  FROM car_file_uploads cfu
  WHERE cfu.car_id = ANY(p_car_ids)
    AND cfu.upload_status = 'completed'
    AND (
      -- Car is in active auction
      EXISTS (
        SELECT 1 
        FROM cars c
        JOIN auction_schedules asch ON c.id = asch.car_id
        WHERE c.id = cfu.car_id
          AND c.is_auction = true
          AND asch.status = 'active'
      )
      -- OR dealer has won this car
      OR EXISTS (
        SELECT 1
        FROM dealer_won_vehicles dwv
        WHERE dwv.car_id = cfu.car_id
          AND dwv.dealer_id = v_dealer_id
      )
    );
  
  RETURN result_json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_car_images_for_dealers(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_car_images_for_dealers(uuid[]) TO anon;

COMMENT ON FUNCTION public.get_car_images_for_dealers IS 'Returns car images as JSONB with proper authorization checks. Dealers can only see images for active auction cars or cars they won.';