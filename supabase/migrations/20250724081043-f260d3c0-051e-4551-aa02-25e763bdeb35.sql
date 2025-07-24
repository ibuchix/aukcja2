-- Add service role access policy to cars table
CREATE POLICY "Service role can access all cars" 
ON public.cars 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add service role access policy to other tables the edge function needs
CREATE POLICY "Service role can access all bids" 
ON public.bids 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can access all dealer_won_vehicles" 
ON public.dealer_won_vehicles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can access all auction_schedules" 
ON public.auction_schedules 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can access all seller_bid_decisions" 
ON public.seller_bid_decisions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);