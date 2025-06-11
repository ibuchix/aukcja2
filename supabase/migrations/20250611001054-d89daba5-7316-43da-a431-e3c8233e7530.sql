
-- Migration: Clean up dealers RLS policies and fix authentication context
-- This migration consolidates multiple redundant RLS policies into clear, simple ones

-- First, drop all existing policies on dealers table to start clean
DROP POLICY IF EXISTS "Dealers can view own profile" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can update own profile" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can insert own profile" ON public.dealers;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.dealers;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.dealers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.dealers;
DROP POLICY IF EXISTS "Users can view their own dealer profile" ON public.dealers;
DROP POLICY IF EXISTS "Users can update their own dealer profile" ON public.dealers;
DROP POLICY IF EXISTS "Users can insert their own dealer profile" ON public.dealers;
DROP POLICY IF EXISTS "Dealers can access their own data" ON public.dealers;

-- Create a single, comprehensive RLS policy for dealers
CREATE POLICY "Dealers comprehensive access policy" 
ON public.dealers 
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a security definer function to help with authentication debugging
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_session_exists boolean;
  v_dealer_exists boolean;
BEGIN
  -- Get the current auth user ID
  v_user_id := auth.uid();
  
  -- Check if session exists
  v_session_exists := v_user_id IS NOT NULL;
  
  -- Check if dealer record exists for this user
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.dealers WHERE user_id = v_user_id
    ) INTO v_dealer_exists;
  ELSE
    v_dealer_exists := false;
  END IF;
  
  RETURN jsonb_build_object(
    'auth_uid', v_user_id,
    'session_exists', v_session_exists,
    'dealer_exists', v_dealer_exists,
    'timestamp', now()
  );
END;
$$;

-- Create a security definer function to get dealer profile safely
CREATE OR REPLACE FUNCTION public.get_dealer_profile_safe(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_dealer_data jsonb;
BEGIN
  -- Use provided user_id or fallback to auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Return null if no user ID available
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get dealer profile data
  SELECT to_jsonb(d) INTO v_dealer_data
  FROM public.dealers d
  WHERE d.user_id = v_user_id;
  
  RETURN v_dealer_data;
END;
$$;
