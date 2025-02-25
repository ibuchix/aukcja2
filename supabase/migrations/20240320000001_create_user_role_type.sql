
-- First ensure any existing data is preserved
CREATE TABLE IF NOT EXISTS temp_profiles AS 
SELECT * FROM profiles WHERE EXISTS (SELECT 1 FROM profiles);

-- Drop existing objects that might conflict
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create new enum type
CREATE TYPE user_role AS ENUM ('dealer', 'admin');

-- Create new profiles table with proper structure
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'dealer',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Restore any existing data with proper role casting
INSERT INTO profiles (id, role, full_name, updated_at)
SELECT 
  id,
  CASE 
    WHEN role IS NULL THEN 'dealer'::user_role
    ELSE role::text::user_role
  END,
  full_name,
  COALESCE(updated_at, NOW())
FROM temp_profiles
WHERE id IS NOT NULL;

-- Clean up
DROP TABLE IF EXISTS temp_profiles;

-- Add initial indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
