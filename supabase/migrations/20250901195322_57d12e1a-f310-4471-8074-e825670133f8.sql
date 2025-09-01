-- SECURITY FIX: Enable RLS and add policies for auction_activity_stats table
-- This table contains sensitive auction metrics that should not be public

-- Enable Row Level Security on auction_activity_stats
ALTER TABLE public.auction_activity_stats ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can view all auction activity stats
CREATE POLICY "Admins can view all auction activity stats"
ON public.auction_activity_stats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Policy 2: Verified dealers can view stats for cars they have bid on
CREATE POLICY "Dealers can view stats for cars they bid on"
ON public.auction_activity_stats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dealers d
    WHERE d.user_id = auth.uid() 
    AND d.is_verified = true
  ) AND
  car_id IN (
    SELECT DISTINCT b.car_id 
    FROM public.bids b
    INNER JOIN public.dealers d ON b.dealer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

-- Policy 3: Sellers can view stats for their own cars
CREATE POLICY "Sellers can view stats for their own cars"
ON public.auction_activity_stats
FOR SELECT
TO authenticated
USING (
  car_id IN (
    SELECT c.id FROM public.cars c
    WHERE c.seller_id = auth.uid()
  )
);

-- Policy 4: Service role can manage all data (for system operations)
CREATE POLICY "Service role can manage auction activity stats"
ON public.auction_activity_stats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment documenting the security fix
COMMENT ON TABLE public.auction_activity_stats IS 'Auction activity statistics - contains sensitive bidding metrics. Access restricted to admins, participating dealers, and car owners only.';