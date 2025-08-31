-- SECURE VIEW REPLACEMENT: Drop insecure auction_activity_stats and create secure version

-- Step 1: Drop the existing insecure view
DROP VIEW IF EXISTS public.auction_activity_stats;

-- Step 2: Create secure replacement view with role-based filtering
CREATE VIEW public.auction_activity_stats AS
SELECT 
    bids.car_id,
    count(DISTINCT bids.dealer_id) AS unique_bidders,
    count(*) AS total_bids,
    max(bids.amount) AS highest_bid,
    min(bids.amount) AS lowest_bid
FROM bids
WHERE 
  -- Security filter: Only show data based on user role and permissions
  (
    -- Admins can see all auction stats
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
    OR
    -- Service role can see all stats for system operations
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    -- Sellers can see stats for their own cars
    bids.car_id IN (
      SELECT c.id FROM cars c WHERE c.seller_id = auth.uid()
    )
    OR
    -- Verified dealers can see stats for auctions they participated in
    (
      EXISTS (
        SELECT 1 FROM dealers d 
        WHERE d.user_id = auth.uid() AND d.is_verified = true
      )
      AND bids.car_id IN (
        SELECT DISTINCT b.car_id 
        FROM bids b
        INNER JOIN dealers d ON b.dealer_id = d.id
        WHERE d.user_id = auth.uid()
      )
    )
  )
GROUP BY bids.car_id;

-- Step 3: Add security documentation
COMMENT ON VIEW public.auction_activity_stats IS 'Secure auction statistics view - filters data based on user role and participation';

-- Step 4: Create secure access function for programmatic use
CREATE OR REPLACE FUNCTION public.get_auction_activity_stats_secure(
  p_car_id uuid DEFAULT NULL
)
RETURNS TABLE(
  car_id uuid,
  unique_bidders bigint,
  total_bids bigint,
  highest_bid numeric,
  lowest_bid numeric
) AS $$
BEGIN
  -- Log access attempt
  PERFORM public.log_auction_stats_access(p_car_id, 'programmatic_access');
  
  -- Return filtered data
  IF p_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM public.auction_activity_stats 
    WHERE auction_activity_stats.car_id = p_car_id;
  ELSE
    RETURN QUERY
    SELECT * FROM public.auction_activity_stats;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create monitoring function for suspicious access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_stats_access()
RETURNS jsonb AS $$
DECLARE
  suspicious_users jsonb;
BEGIN
  -- Find users with excessive access in the last hour
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_id,
      'access_count', access_count,
      'last_access', last_access
    )
  ) INTO suspicious_users
  FROM (
    SELECT 
      user_id,
      COUNT(*) as access_count,
      MAX(created_at) as last_access
    FROM public.auction_stats_access_log
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 50  -- Flag users with >50 accesses per hour
    ORDER BY COUNT(*) DESC
  ) suspicious;
  
  RETURN COALESCE(suspicious_users, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add helpful comments
COMMENT ON FUNCTION public.get_auction_activity_stats_secure IS 'Secure function to access auction statistics with access logging';
COMMENT ON FUNCTION public.detect_suspicious_stats_access IS 'Monitor and detect suspicious access patterns to auction statistics';