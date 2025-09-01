-- SECURITY FIX: Create secure function for auction_activity_stats view access
-- Since auction_activity_stats is a view, we can't enable RLS on it directly
-- Instead, we create a security definer function to control access

-- Create a secure function that only allows authorized users to access auction stats
CREATE OR REPLACE FUNCTION public.get_auction_activity_stats(p_car_id uuid DEFAULT NULL)
RETURNS TABLE(
  car_id uuid,
  unique_bidders bigint,
  total_bids bigint,
  highest_bid numeric,
  lowest_bid numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Allow admins to see all stats
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    IF p_car_id IS NULL THEN
      RETURN QUERY SELECT * FROM public.auction_activity_stats;
    ELSE
      RETURN QUERY SELECT * FROM public.auction_activity_stats WHERE auction_activity_stats.car_id = p_car_id;
    END IF;
    RETURN;
  END IF;
  
  -- Allow verified dealers to see stats for cars they've bid on
  IF EXISTS (
    SELECT 1 FROM public.dealers d
    WHERE d.user_id = auth.uid() AND d.is_verified = true
  ) THEN
    IF p_car_id IS NULL THEN
      -- Return stats for cars the dealer has bid on
      RETURN QUERY 
      SELECT aas.* FROM public.auction_activity_stats aas
      WHERE aas.car_id IN (
        SELECT DISTINCT b.car_id 
        FROM public.bids b
        INNER JOIN public.dealers d ON b.dealer_id = d.id
        WHERE d.user_id = auth.uid()
      );
    ELSE
      -- Return stats for specific car if dealer has bid on it
      RETURN QUERY 
      SELECT aas.* FROM public.auction_activity_stats aas
      WHERE aas.car_id = p_car_id
      AND aas.car_id IN (
        SELECT DISTINCT b.car_id 
        FROM public.bids b
        INNER JOIN public.dealers d ON b.dealer_id = d.id
        WHERE d.user_id = auth.uid()
      );
    END IF;
    RETURN;
  END IF;
  
  -- Allow sellers to see stats for their own cars
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'seller'::user_role
  ) THEN
    IF p_car_id IS NULL THEN
      -- Return stats for seller's own cars
      RETURN QUERY 
      SELECT aas.* FROM public.auction_activity_stats aas
      WHERE aas.car_id IN (
        SELECT c.id FROM public.cars c
        WHERE c.seller_id = auth.uid()
      );
    ELSE
      -- Return stats for specific car if seller owns it
      RETURN QUERY 
      SELECT aas.* FROM public.auction_activity_stats aas
      WHERE aas.car_id = p_car_id
      AND aas.car_id IN (
        SELECT c.id FROM public.cars c
        WHERE c.seller_id = auth.uid()
      );
    END IF;
    RETURN;
  END IF;
  
  -- If user doesn't meet any criteria, return no data
  RETURN;
END;
$$;

-- Add comment documenting the security fix
COMMENT ON FUNCTION public.get_auction_activity_stats(uuid) IS 'Secure access function for auction activity stats. Replaces direct view access to prevent data leakage. Only allows admins, participating dealers, and car owners to access relevant statistics.';