-- Create RPC function for dealers to access car images
-- This bypasses RLS issues by using SECURITY DEFINER with manual authorization
CREATE OR REPLACE FUNCTION public.get_car_images_for_dealers(p_car_ids uuid[])
RETURNS SETOF car_file_uploads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_dealer_id uuid;
  v_is_verified boolean := false;
  v_log_context jsonb;
BEGIN
  -- Log function entry
  v_log_context := jsonb_build_object(
    'function', 'get_car_images_for_dealers',
    'user_id', auth.uid(),
    'car_ids_count', array_length(p_car_ids, 1),
    'timestamp', now()
  );
  
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'car_images_access', 
    'Dealer requesting car images via RPC', 
    v_log_context
  );

  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    INSERT INTO system_logs (
      log_type, 
      message, 
      error_message,
      details
    ) VALUES (
      'car_images_access_denied', 
      'Unauthenticated user attempted to access car images', 
      'No authentication context',
      v_log_context
    );
    RETURN;
  END IF;

  -- Get dealer info and verification status
  SELECT d.id, d.is_verified
  INTO v_dealer_id, v_is_verified
  FROM dealers d
  WHERE d.user_id = auth.uid();

  -- Check if user is a verified dealer
  IF v_dealer_id IS NULL OR NOT v_is_verified THEN
    INSERT INTO system_logs (
      log_type, 
      message, 
      error_message,
      details
    ) VALUES (
      'car_images_access_denied', 
      'User is not a verified dealer', 
      CASE 
        WHEN v_dealer_id IS NULL THEN 'No dealer record found'
        ELSE 'Dealer not verified'
      END,
      v_log_context || jsonb_build_object(
        'dealer_id', v_dealer_id,
        'is_verified', v_is_verified
      )
    );
    RETURN;
  END IF;

  -- Log successful authorization
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'car_images_access_granted', 
    'Verified dealer accessing car images', 
    v_log_context || jsonb_build_object(
      'dealer_id', v_dealer_id,
      'is_verified', v_is_verified
    )
  );

  -- Return car file uploads for auction cars only
  -- This implements the same logic as the RLS policy but server-side
  RETURN QUERY
  SELECT cfu.*
  FROM car_file_uploads cfu
  INNER JOIN cars c ON cfu.car_id = c.id
  WHERE cfu.car_id = ANY(p_car_ids)
    AND c.is_auction = true
    AND cfu.upload_status = 'completed'
  ORDER BY cfu.car_id, cfu.category, cfu.display_order;

  -- Log successful query completion
  INSERT INTO system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'car_images_access_success', 
    'Car images query completed successfully', 
    v_log_context || jsonb_build_object(
      'dealer_id', v_dealer_id,
      'returned_rows', (
        SELECT COUNT(*)
        FROM car_file_uploads cfu
        INNER JOIN cars c ON cfu.car_id = c.id
        WHERE cfu.car_id = ANY(p_car_ids)
          AND c.is_auction = true
          AND cfu.upload_status = 'completed'
      )
    )
  );

EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO system_logs (
    log_type, 
    message, 
    error_message,
    details
  ) VALUES (
    'car_images_access_error', 
    'Error in get_car_images_for_dealers function', 
    SQLERRM,
    v_log_context || jsonb_build_object(
      'error_code', SQLSTATE,
      'dealer_id', v_dealer_id
    )
  );
  
  -- Re-raise the error
  RAISE;
END;
$function$;