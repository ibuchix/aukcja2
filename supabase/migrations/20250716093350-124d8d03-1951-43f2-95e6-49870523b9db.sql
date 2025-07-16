-- Fix infinite recursion in bids RLS policies
-- The issue is that policies are querying the bids table within a policy applied to the bids table

-- First, create a security definer function to safely get dealer's car IDs they're bidding on
CREATE OR REPLACE FUNCTION public.get_dealer_bidding_car_ids(p_dealer_user_id uuid)
RETURNS TABLE(car_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT b.car_id
  FROM bids b
  INNER JOIN dealers d ON b.dealer_id = d.id
  WHERE d.user_id = p_dealer_user_id AND d.is_verified = true;
END;
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Dealers can view all bids on cars they're bidding on" ON public.bids;

-- Create a new policy that uses the security definer function
CREATE POLICY "Dealers can view bids on cars they're bidding on" 
ON public.bids 
FOR SELECT 
USING (
  car_id IN (
    SELECT car_id FROM public.get_dealer_bidding_car_ids(auth.uid())
  )
);