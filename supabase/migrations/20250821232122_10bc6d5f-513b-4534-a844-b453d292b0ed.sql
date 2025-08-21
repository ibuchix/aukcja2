-- Add RLS policy for dealers to view car images in auctions
CREATE POLICY "Dealers can view auction car images" 
ON public.car_file_uploads 
FOR SELECT 
USING (
  -- Allow dealers to view images for cars that are in auction
  EXISTS(
    SELECT 1 
    FROM public.cars c
    JOIN public.dealers d ON d.user_id = auth.uid()
    WHERE c.id = car_file_uploads.car_id 
    AND c.is_auction = true
    AND d.is_verified = true
  )
);