
-- First, clean up any NULL roles by setting them to 'dealer'
UPDATE profiles 
SET role = 'dealer'::user_role 
WHERE role IS NULL;

-- Clean up any case mismatches by converting to lowercase
UPDATE profiles 
SET role = LOWER(role::text)::user_role 
WHERE role::text != LOWER(role::text);

-- Delete orphaned profiles (profiles without auth users)
DELETE FROM profiles p 
WHERE NOT EXISTS (
    SELECT 1 
    FROM auth.users u 
    WHERE u.id = p.id
);

-- Add NOT NULL constraint to role column
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL;

-- Create a trigger function to ensure role consistency
CREATE OR REPLACE FUNCTION ensure_valid_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure role is lowercase
    NEW.role = LOWER(NEW.role::text)::user_role;
    
    -- Ensure role exists
    IF NEW.role IS NULL THEN
        NEW.role = 'dealer'::user_role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce role validation on insert and update
DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
CREATE TRIGGER validate_role_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_valid_role();

-- Add constraint to ensure role is either 'dealer' or 'admin'
ALTER TABLE profiles 
ADD CONSTRAINT valid_role_values 
CHECK (role IN ('dealer', 'admin'));

-- Create function to sync auth metadata with profile role
CREATE OR REPLACE FUNCTION sync_auth_metadata() 
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth.users metadata to match profile role
    UPDATE auth.users 
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role::text)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep auth metadata in sync with profile role
DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON profiles;
CREATE TRIGGER sync_auth_metadata_trigger
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_metadata();

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
