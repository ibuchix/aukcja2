
-- Create the user_role type first (if not exists)
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('dealer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'dealer',
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
