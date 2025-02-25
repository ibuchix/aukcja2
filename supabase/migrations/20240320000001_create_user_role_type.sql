
-- First ensure the type doesn't exist
DROP TYPE IF EXISTS user_role;

-- Create new enum type
CREATE TYPE user_role AS ENUM ('dealer', 'admin');

-- Make sure profiles table exists with proper role column
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'dealer',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update any existing rows
UPDATE profiles 
SET role = 'dealer'::user_role 
WHERE role IS NULL;
