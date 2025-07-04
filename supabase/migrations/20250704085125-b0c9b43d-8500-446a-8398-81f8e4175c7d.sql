-- Clean up conflicting RLS policies on bids table that are causing 500 errors
-- The issue is some policies expect dealer_id = auth.uid() (user ID) 
-- while dealer_id is actually the dealers table ID

-- Drop all the conflicting policies
DROP POLICY IF EXISTS "Dealers can place bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can view own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can view winning bids on auctions they participated in" ON public.bids;
DROP POLICY IF EXISTS "Dealers can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can insert their own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can update their own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can delete their own bids" ON public.bids;

-- Create clean, consistent policies
CREATE POLICY "Dealers can view all bids for transparency" 
ON public.bids 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);

CREATE POLICY "Dealers can insert bids for their dealer profile" 
ON public.bids 
FOR INSERT 
WITH CHECK (
  dealer_id IN (
    SELECT id FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);

CREATE POLICY "Dealers can update their own bids" 
ON public.bids 
FOR UPDATE 
USING (
  dealer_id IN (
    SELECT id FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);

CREATE POLICY "Dealers can delete their own bids" 
ON public.bids 
FOR DELETE 
USING (
  dealer_id IN (
    SELECT id FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);