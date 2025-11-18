-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_car_images_for_dealers(uuid[]);

-- Recreate with JSONB return type to bypass client-side RLS filtering
CREATE OR REPLACE FUNCTION public.get_car_images_for_dealers(p_car_ids uuid[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- Build JSON array of all matching uploads
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
    AND cfu.upload_status = 'completed';
  
  RETURN result_json;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_car_images_for_dealers(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_car_images_for_dealers(uuid[]) TO anon;

COMMENT ON FUNCTION public.get_car_images_for_dealers IS 'Returns car images as JSONB to bypass client-side RLS filtering. Used by dealers to view auction car images.';