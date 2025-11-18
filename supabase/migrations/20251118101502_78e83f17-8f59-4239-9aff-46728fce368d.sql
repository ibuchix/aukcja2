-- Fix RLS filtering issue by explicitly disabling row security
-- This ensures the RPC function bypasses RLS policies when returning image data

CREATE OR REPLACE FUNCTION get_car_images_for_dealers(p_car_ids uuid[])
RETURNS SETOF car_file_uploads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN QUERY
  SELECT cfu.*
  FROM car_file_uploads cfu
  WHERE cfu.car_id = ANY(p_car_ids)
    AND cfu.upload_status = 'completed'
  ORDER BY cfu.car_id, cfu.category, cfu.display_order;
END;
$$;