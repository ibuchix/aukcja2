
-- Create the user_role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('dealer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to use the new type
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role 
USING role::user_role;
