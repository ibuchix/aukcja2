
-- Clean up cars table RLS policies to fix dashboard access issues
-- Drop all existing conflicting policies on cars table
DROP POLICY IF EXISTS "Dealers can view cars" ON public.cars;
DROP POLICY IF EXISTS "Dealers can view auction cars" ON public.cars;
DROP POLICY IF EXISTS "Dealers can access auction cars" ON public.cars;
DROP POLICY IF EXISTS "Verified dealers can view cars" ON public.cars;
DROP POLICY IF EXISTS "Verified dealers can view auction cars" ON public.cars;
DROP POLICY IF EXISTS "Allow verified dealers to view cars" ON public.cars;
DROP POLICY IF EXISTS "Allow dealers to view cars" ON public.cars;
DROP POLICY IF EXISTS "Sellers can manage their cars" ON public.cars;
DROP POLICY IF EXISTS "Sellers can view their own cars" ON public.cars;
DROP POLICY IF EXISTS "Sellers can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Sellers can update their cars" ON public.cars;
DROP POLICY IF EXISTS "Sellers can delete their cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can manage all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;
DROP POLICY IF EXISTS "Allow admin full access to cars" ON public.cars;
DROP POLICY IF EXISTS "Public can view active auction cars" ON public.cars;
DROP POLICY IF EXISTS "Allow public read access to cars" ON public.cars;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cars;

-- Create simple, clear policies for cars table
-- Allow all authenticated users to SELECT (read) cars
CREATE POLICY "All authenticated users can view cars" 
ON public.cars 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow sellers to INSERT cars where they are the seller
CREATE POLICY "Sellers can create their own cars" 
ON public.cars 
FOR INSERT 
WITH CHECK (
  auth.uid() = seller_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('seller'::user_role, 'admin'::user_role)
  )
);

-- Allow sellers to UPDATE their own cars, admins can update any
CREATE POLICY "Sellers can update their own cars, admins can update any" 
ON public.cars 
FOR UPDATE 
USING (
  auth.uid() = seller_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Allow sellers to DELETE their own cars, admins can delete any
CREATE POLICY "Sellers can delete their own cars, admins can delete any" 
ON public.cars 
FOR DELETE 
USING (
  auth.uid() = seller_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);
