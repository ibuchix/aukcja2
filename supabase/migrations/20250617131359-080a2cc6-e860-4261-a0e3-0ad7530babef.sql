
-- Drop all existing policies on auction_schedules to start clean
DROP POLICY IF EXISTS "Admins can manage auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can insert auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can view all auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can update auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Admins can delete auction schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Allow admin full access to auction_schedules" ON public.auction_schedules;
DROP POLICY IF EXISTS "Verified dealers can access auction schedules via joins" ON public.auction_schedules;

-- Create simple, clear policies
-- Allow all authenticated users to SELECT (read) auction schedules
CREATE POLICY "All authenticated users can view auction schedules" 
ON public.auction_schedules 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can INSERT auction schedules
CREATE POLICY "Only admins can create auction schedules" 
ON public.auction_schedules 
FOR INSERT 
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
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);
