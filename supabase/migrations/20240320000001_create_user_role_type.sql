
-- Drop everything first to ensure clean slate
DO $$ 
BEGIN
    -- Drop triggers first
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
    DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON profiles;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS public.handle_new_user();
    DROP FUNCTION IF EXISTS ensure_valid_role();
    DROP FUNCTION IF EXISTS sync_auth_metadata();
    
    -- Drop tables and types
    DROP TABLE IF EXISTS profiles CASCADE;
    DROP TYPE IF EXISTS user_role CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, just continue
        NULL;
END $$;

-- Create the user_role type first
CREATE TYPE user_role AS ENUM ('dealer', 'admin');

-- Create the profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'dealer',
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_role ON profiles(role);
