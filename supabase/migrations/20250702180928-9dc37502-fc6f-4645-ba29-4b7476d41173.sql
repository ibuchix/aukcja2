-- Create a security definer function to get dealer_id by user_id
CREATE OR REPLACE FUNCTION public.get_dealer_id_by_user_id(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT id FROM dealers WHERE user_id = p_user_id LIMIT 1);
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Dealers can view their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can insert their own won vehicles" ON public.dealer_won_vehicles;
DROP POLICY IF EXISTS "Dealers can update their own won vehicles" ON public.dealer_won_vehicles;

-- Create simplified RLS policies that work with the current authentication setup
CREATE POLICY "Dealers can view their own won vehicles"
ON public.dealer_won_vehicles
FOR SELECT
USING (dealer_id = get_dealer_id_by_user_id(auth.uid()));

CREATE POLICY "Dealers can insert their own won vehicles"
ON public.dealer_won_vehicles
FOR INSERT
WITH CHECK (dealer_id = get_dealer_id_by_user_id(auth.uid()));

CREATE POLICY "Dealers can update their own won vehicles"
ON public.dealer_won_vehicles
FOR UPDATE
USING (dealer_id = get_dealer_id_by_user_id(auth.uid()))
WITH CHECK (dealer_id = get_dealer_id_by_user_id(auth.uid()));