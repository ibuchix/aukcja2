-- Fix security vulnerability in get_email_notification_counts function
-- This function was allowing unauthorized access to email_notification_events data

-- Drop the existing insecure function
DROP FUNCTION IF EXISTS public.get_email_notification_counts(uuid[]);

-- Create a secure version that only allows admin access
CREATE OR REPLACE FUNCTION public.get_email_notification_counts(p_car_ids uuid[])
 RETURNS TABLE(car_id uuid, type text, send_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied. Only administrators can view email notification data.';
  END IF;
  
  -- Return the email notification counts for admins only
  RETURN QUERY
  SELECT e.car_id, e.type, COUNT(*)::int AS send_count
  FROM public.email_notification_events e
  WHERE e.car_id = ANY(p_car_ids)
  GROUP BY e.car_id, e.type;
END;
$function$;

-- Add a comment explaining the security fix
COMMENT ON FUNCTION public.get_email_notification_counts(uuid[]) IS 
'Secured function that returns email notification counts. Access restricted to admin users only to prevent exposure of email communication patterns.';