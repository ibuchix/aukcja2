
-- Drop dependent objects first
DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON profiles;
DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
DROP TABLE IF EXISTS profiles;
DROP TYPE IF EXISTS user_role;

-- Create the user_role type
CREATE TYPE user_role AS ENUM ('dealer', 'seller', 'admin');

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'dealer',
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

