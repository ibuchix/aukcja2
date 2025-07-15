-- Fix the critical RLS policy issue on bids table
-- The current policy incorrectly compares dealer_id (dealer profile ID) to auth.uid() (user ID)
-- These are different values, so no bids are returned to dealers

-- Drop the existing broken policies
DROP POLICY IF EXISTS "Dealers can view all bids for transparency" ON public.bids;
DROP POLICY IF EXISTS "Dealers can insert bids for their dealer profile" ON public.bids;
DROP POLICY IF EXISTS "Dealers can update their own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers can delete their own bids" ON public.bids;
DROP POLICY IF EXISTS "Dealers manage own bids" ON public.bids;

-- Create correct policies that properly join with dealers table
CREATE POLICY "Dealers can view their own bids" 
ON public.bids 
FOR SELECT 
USING (
  dealer_id IN (
    SELECT id FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);

CREATE POLICY "Dealers can insert their own bids" 
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

-- Also allow dealers to view all bids for transparency (on cars they're bidding on)
CREATE POLICY "Dealers can view all bids on cars they're bidding on" 
ON public.bids 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dealers 
    WHERE user_id = auth.uid() AND is_verified = true
  )
  AND car_id IN (
    SELECT DISTINCT car_id FROM public.bids b2
    WHERE b2.dealer_id IN (
      SELECT id FROM public.dealers 
      WHERE user_id = auth.uid()
    )
  )
);