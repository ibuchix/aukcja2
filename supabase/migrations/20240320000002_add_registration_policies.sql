
-- Enable RLS on the tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own profile during registration
CREATE POLICY "Allow profile creation on registration"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Allow users to read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow dealer profile creation during registration
CREATE POLICY "Allow dealer profile creation on registration"
ON public.dealers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow dealers to read their own profile
CREATE POLICY "Allow dealers to read own profile"
ON public.dealers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow dealers to update their own profile
CREATE POLICY "Allow dealers to update own profile"
ON public.dealers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all records (needed for admin functions)
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all dealers"
ON public.dealers
TO service_role
USING (true)
WITH CHECK (true);
