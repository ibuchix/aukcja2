
-- Add comprehensive RLS policy for verified dealers to access auction schedules via JOINs
CREATE POLICY "Verified dealers can access auction schedules via joins" 
ON public.auction_schedules 
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM public.dealers 
    WHERE user_id = auth.uid() 
    AND is_verified = true
  )
);

-- Drop the old more restrictive policy since we're replacing it with the comprehensive one
DROP POLICY IF EXISTS "Dealers can view auction schedules" ON public.auction_schedules;
