-- Enable Row Level Security on auction_activity_stats table
ALTER TABLE public.auction_activity_stats ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins have full access to all auction statistics
CREATE POLICY "Admins can view all auction statistics" 
ON public.auction_activity_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  )
);

-- Policy 2: Service role needs access for automated processing
CREATE POLICY "Service role can manage auction statistics" 
ON public.auction_activity_stats 
FOR ALL 
USING (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  current_setting('role') = 'service_role'
)
WITH CHECK (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  current_setting('role') = 'service_role'
);

-- Policy 3: Dealers can only view stats for auctions they have participated in
CREATE POLICY "Dealers can view stats for participated auctions only"
ON public.auction_activity_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM dealers d
    WHERE d.user_id = auth.uid() 
    AND d.is_verified = true
  )
  AND 
  car_id IN (
    SELECT DISTINCT b.car_id 
    FROM bids b
    INNER JOIN dealers d ON b.dealer_id = d.id
    WHERE d.user_id = auth.uid()
  )
);

-- Policy 4: Sellers can view stats for their own cars
CREATE POLICY "Sellers can view stats for their own cars"
ON public.auction_activity_stats
FOR SELECT
USING (
  car_id IN (
    SELECT c.id 
    FROM cars c 
    WHERE c.seller_id = auth.uid()
  )
);

-- Add audit logging to track access to sensitive auction data
CREATE TABLE IF NOT EXISTS public.auction_stats_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  car_id uuid,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the access log table
ALTER TABLE public.auction_stats_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Only admins can view auction stats access logs"
ON public.auction_stats_access_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  )
);

-- Service role can insert access logs
CREATE POLICY "Service role can insert access logs"
ON public.auction_stats_access_log
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  current_setting('role') = 'service_role'
);

-- Create function to log access attempts
CREATE OR REPLACE FUNCTION public.log_auction_stats_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log SELECT operations from actual users (not service role)
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.auction_stats_access_log (
      user_id,
      car_id,
      action,
      created_at
    ) VALUES (
      auth.uid(),
      NEW.car_id,
      'stats_viewed',
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log access
CREATE TRIGGER log_auction_stats_access_trigger
  AFTER SELECT ON public.auction_activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.log_auction_stats_access();

-- Add comments for documentation
COMMENT ON TABLE public.auction_activity_stats IS 'Sensitive auction business intelligence - access is logged and restricted';
COMMENT ON POLICY "Admins can view all auction statistics" ON public.auction_activity_stats IS 'Full admin access for business operations';
COMMENT ON POLICY "Dealers can view stats for participated auctions only" ON public.auction_activity_stats IS 'Dealers limited to auctions they bid on';
COMMENT ON POLICY "Sellers can view stats for their own cars" ON public.auction_activity_stats IS 'Sellers can see performance of their vehicles';
COMMENT ON TABLE public.auction_stats_access_log IS 'Audit trail for sensitive auction data access';