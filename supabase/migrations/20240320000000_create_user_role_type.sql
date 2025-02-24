
-- Drop existing type
DROP TYPE IF EXISTS user_role;

-- Create new enum type
CREATE TYPE user_role AS ENUM ('dealer', 'admin');

-- Update profiles table
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role 
USING role::user_role;
