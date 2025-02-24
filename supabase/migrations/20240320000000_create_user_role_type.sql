
-- First drop any existing type if it exists
DROP TYPE IF EXISTS user_role;

-- Create the user_role type if it doesn't exist
CREATE TYPE user_role AS ENUM ('dealer', 'admin');

-- Update profiles table to use the new type
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role 
USING role::user_role;

