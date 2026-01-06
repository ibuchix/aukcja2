-- Phase 1: Drop policies that reference profiles.role directly
DROP POLICY IF EXISTS "Service roles can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Sellers can insert their own manual valuation uploads" ON public.manual_file_uploads;
DROP POLICY IF EXISTS "Sellers can view their own manual valuation uploads" ON public.manual_file_uploads;
DROP POLICY IF EXISTS "Sellers can update their own manual valuation uploads" ON public.manual_file_uploads;
DROP POLICY IF EXISTS "Sellers can delete their own manual valuation uploads" ON public.manual_file_uploads;

-- Phase 1: Create new secure policies using has_role()
CREATE POLICY "Service roles can create notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id) 
  OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text) 
  OR has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Sellers can view their own manual valuation uploads" ON public.manual_file_uploads
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND has_role(auth.uid(), 'seller'::user_role));

CREATE POLICY "Sellers can insert their own manual valuation uploads" ON public.manual_file_uploads
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'seller'::user_role));

CREATE POLICY "Sellers can update their own manual valuation uploads" ON public.manual_file_uploads
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND has_role(auth.uid(), 'seller'::user_role))
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'seller'::user_role));

CREATE POLICY "Sellers can delete their own manual valuation uploads" ON public.manual_file_uploads
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND has_role(auth.uid(), 'seller'::user_role));

-- Phase 2: Fix the Self-Referencing UPDATE Policy
DROP POLICY IF EXISTS "Users can update own profile (role protected)" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Phase 3: Create Trigger to Protect Role Column
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed and user is not admin, reject
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT has_role(auth.uid(), 'admin'::user_role) THEN
      RAISE EXCEPTION 'Cannot modify role directly. Use proper role assignment.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role();