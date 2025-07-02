
-- Drop existing incorrect policies for dealer_won_vehicles
DROP POLICY IF EXISTS "Dealers can view their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can insert their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can update their own won vehicles" ON public.dealer_won_vehicles;

-- Create corrected RLS policies for dealer_won_vehicles
CREATE POLICY "Dealers can view their own won vehicles"
ON public.dealer_won_vehicles
FOR SELECT
USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Dealers can insert their own won vehicles"
ON public.dealer_won_vehicles
FOR INSERT
WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Dealers can update their own won vehicles"
ON public.dealer_won_vehicles
FOR UPDATE
USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));
