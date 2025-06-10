
-- Add RLS policy to allow verified dealers to view auction schedules
CREATE POLICY "Dealers can view auction schedules" 
ON public.auction_schedules 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.dealers 
    WHERE user_id = auth.uid() 
    AND is_verified = true
  )
);
