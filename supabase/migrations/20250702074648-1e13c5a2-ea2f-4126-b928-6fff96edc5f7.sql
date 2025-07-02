
-- Add RLS policies for dealer_won_vehicles table to allow dealers to view their own won vehicles
-- and admins to view all

-- Enable RLS if not already enabled
ALTER TABLE public.dealer_won_vehicles ENABLE ROW LEVEL SECURITY;

-- Allow dealers to view their own won vehicles
CREATE POLICY "Dealers can view their own won vehicles"
ON public.dealer_won_vehicles
FOR SELECT
USING (dealer_id = auth.uid());

-- Allow dealers to insert their own won vehicle records (for system processes)
CREATE POLICY "Dealers can insert their own won vehicles"
ON public.dealer_won_vehicles
FOR INSERT
WITH CHECK (dealer_id = auth.uid());

-- Allow dealers to update their own won vehicle records
CREATE POLICY "Dealers can update their own won vehicles"
ON public.dealer_won_vehicles
FOR UPDATE
USING (dealer_id = auth.uid())
WITH CHECK (dealer_id = auth.uid());

-- Allow admins full access
CREATE POLICY "Admins have full access to dealer_won_vehicles"
ON public.dealer_won_vehicles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Allow service role full access for system operations
CREATE POLICY "Service role can manage all dealer_won_vehicles"
ON public.dealer_won_vehicles
TO service_role
USING (true)
WITH CHECK (true);
