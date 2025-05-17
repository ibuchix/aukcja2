
-- Add debug function to help troubleshoot permission issues
CREATE OR REPLACE FUNCTION public.debug_auth_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN auth.uid()::TEXT;
END;
$$;
