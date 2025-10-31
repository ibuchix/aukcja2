-- Drop the existing overly permissive dealer view policy
DROP POLICY IF EXISTS "Dealers view cars" ON public.cars;

-- Create a stricter policy that requires dealers to be both authenticated AND verified
CREATE POLICY "Verified dealers can view all cars"
ON public.cars
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.dealers d
    INNER JOIN public.profiles p ON p.id = d.user_id
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
      AND p.role = 'dealer'
  )
);

-- Add helpful comment explaining the security measure
COMMENT ON POLICY "Verified dealers can view all cars" ON public.cars IS 
'Only verified and authenticated dealers can view all car details including seller contact information. This prevents unauthorized access to sensitive seller data while maintaining full functionality for legitimate dealers.';