
-- Drop all existing policies on auction_schedules to start clean
DROP POLICY IF EXISTS "All authenticated users can view auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Only admins can create auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Only admins can update auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Only admins can delete auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can manage auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can insert auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can view all auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can update auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can delete auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Allow admin full access to auction_schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Verified dealers can access auction schedules via joins" ON public.auction_schedules;

-- Create comprehensive policies for auction_schedules
-- Allow verified dealers and admins to SELECT auction schedules
CREATE POLICY "Verified dealers and admins can view auction schedules" 
ON public.auction_schedules 
FOR SELECT 
TO authenticated
USING (
  -- Allow admins to see all schedules
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
  OR
  -- Allow verified dealers to see all schedules
  EXISTS (
    SELECT 1 FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);

-- Only admins can INSERT auction schedules
CREATE POLICY "Only admins can create auction schedules" 
ON public.auction_schedules 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Only admins can UPDATE auction schedules
CREATE POLICY "Only admins can update auction schedules" 
ON public.auction_schedules 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Only admins can DELETE auction schedules
CREATE POLICY "Only admins can delete auction schedules" 
ON public.auction_schedules 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Create a debug function to help troubleshoot authentication issues
CREATE OR REPLACE FUNCTION public.debug_auction_schedules_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean := false;
  v_is_verified_dealer boolean := false;
  v_dealer_exists boolean := false;
  v_profile_exists boolean := false;
  v_schedules_count integer := 0;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'No authenticated user',
      'auth_uid', v_user_id
    );
  END IF;
  
  -- Check if profile exists and role
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = v_user_id
  ), EXISTS(
    SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin'::user_role
  ) INTO v_profile_exists, v_is_admin;
  
  -- Check dealer status
  SELECT EXISTS(
    SELECT 1 FROM public.dealers WHERE user_id = v_user_id
  ), EXISTS(
    SELECT 1 FROM public.dealers WHERE user_id = v_user_id AND is_verified = true
  ) INTO v_dealer_exists, v_is_verified_dealer;
  
  -- Try to count schedules (this will test RLS)
  BEGIN
    SELECT COUNT(*) INTO v_schedules_count FROM public.auction_schedules;
  EXCEPTION WHEN OTHERS THEN
    v_schedules_count := -1; -- Indicates access denied
  END;
  
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'profile_exists', v_profile_exists,
    'is_admin', v_is_admin,
    'dealer_exists', v_dealer_exists,
    'is_verified_dealer', v_is_verified_dealer,
    'schedules_accessible', v_schedules_count >= 0,
    'schedules_count', v_schedules_count,
    'timestamp', now()
  );
END;
$$;
