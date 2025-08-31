-- Phase 1: Fix critical admin and auth functions search path vulnerability
-- Adding SET search_path TO 'public' to prevent SQL injection and privilege escalation

-- Admin Functions (High Priority - these have elevated privileges)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_id = '3f07ea49-328e-4e21-878d-bef9f58af02e'::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.test_admin_policies()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  test_results jsonb := '{}'::jsonb;
  admin_user_id uuid := '3f07ea49-328e-4e21-878d-bef9f58af02e';
BEGIN
  -- Test is_admin() function
  SELECT jsonb_build_object(
    'is_admin_result', public.is_admin(),
    'is_current_user_admin_result', public.is_current_user_admin(),
    'auth_uid', auth.uid(),
    'current_user_role', (SELECT role FROM profiles WHERE id = auth.uid())
  ) INTO test_results;
  
  RETURN test_results;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_auction_listings(p_show_all boolean DEFAULT true, p_status text DEFAULT NULL::text)
 RETURNS SETOF cars
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_status IS NULL OR p_status = 'all' THEN
    RETURN QUERY
    SELECT * FROM cars;
  ELSE
    RETURN QUERY
    SELECT * FROM cars
    WHERE auction_status = p_status;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_active_auctions()
 RETURNS SETOF cars
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM cars
  WHERE is_auction = true
  AND auction_status IN ('active', 'pending')
  ORDER BY auction_end_time ASC;
END;
$function$;

-- Authentication Functions (Critical for access control)
CREATE OR REPLACE FUNCTION public.debug_auth_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Test auth.uid() and session details
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'timestamp', now(),
    'dealer_exists', EXISTS(SELECT 1 FROM dealers WHERE user_id = auth.uid()),
    'session_exists', auth.uid() IS NOT NULL
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Dealer Management Functions (Control dealer creation and verification)
CREATE OR REPLACE FUNCTION public.get_dealer_id_by_user_id(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT id FROM dealers WHERE user_id = p_user_id LIMIT 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dealer_profile_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.dealers WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_dealer_user_id(p_dealer_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT d.user_id
  FROM public.dealers d
  WHERE d.id = p_dealer_id
  LIMIT 1;
$function$;

-- Car Access Control Functions (Control who can see car details)
CREATE OR REPLACE FUNCTION public.get_car_details_for_ownership(p_car_id uuid, p_user_id uuid)
 RETURNS TABLE(car_id uuid, seller_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return car details only if the user owns the car
  RETURN QUERY
  SELECT 
    c.id as car_id,
    c.seller_id
  FROM public.cars c
  WHERE c.id = p_car_id 
    AND c.seller_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_car_summary_for_notifications(p_car_id uuid)
 RETURNS TABLE(seller_id uuid, title text, make text, model text, year integer, auction_end_time timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.seller_id, c.title, c.make, c.model, c.year, c.auction_end_time
  FROM public.cars c
  WHERE c.id = p_car_id;
$function$;

-- System Utility Functions (Used for system operations)
CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
 RETURNS TABLE(column_name text, data_type text, is_nullable text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT,
    columns.is_nullable::TEXT
  FROM 
    information_schema.columns
  WHERE 
    columns.table_schema = 'public'
    AND columns.table_name = p_table_name;
END;
$function$;

-- Notification Functions (Control email notifications)
CREATE OR REPLACE FUNCTION public.mark_car_email_notification_sent(p_car_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.cars
  SET email_notification_sent = true,
      updated_at = NOW()
  WHERE id = p_car_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_email_notification_counts(p_car_ids uuid[])
 RETURNS TABLE(car_id uuid, type text, send_count integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT e.car_id, e.type, COUNT(*)::int AS send_count
  FROM public.email_notification_events e
  WHERE e.car_id = ANY(p_car_ids)
  GROUP BY e.car_id, e.type
$function$;

-- Car Images Access Control (Critical for dealer access to car images)
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

-- Add logging for security fix
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'security_fix', 
  'Phase 1: Fixed search_path vulnerability in 14 critical functions', 
  jsonb_build_object(
    'phase', 1,
    'functions_fixed', 14,
    'vulnerability_type', 'search_path_manipulation',
    'severity', 'MEDIUM',
    'timestamp', now()
  )
);