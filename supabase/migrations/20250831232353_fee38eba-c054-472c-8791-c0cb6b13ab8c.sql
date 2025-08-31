-- Phase 1A: Fix critical functions that we have permission to modify
-- Adding SET search_path TO 'public' to prevent SQL injection and privilege escalation

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

-- Add logging for security fix
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'security_fix', 
  'Phase 1A: Fixed search_path vulnerability in 6 critical functions', 
  jsonb_build_object(
    'phase', '1A',
    'functions_fixed', 6,
    'vulnerability_type', 'search_path_manipulation',
    'severity', 'MEDIUM',
    'timestamp', now()
  )
);