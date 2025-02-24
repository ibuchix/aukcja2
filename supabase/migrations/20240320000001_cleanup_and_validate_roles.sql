
-- Clean up NULL roles
UPDATE profiles 
SET role = 'dealer'::user_role 
WHERE role IS NULL;

-- Fix case mismatches
UPDATE profiles 
SET role = LOWER(role::text)::user_role 
WHERE role::text != LOWER(role::text);

-- Remove orphaned profiles
DELETE FROM profiles p 
WHERE NOT EXISTS (
    SELECT 1 
    FROM auth.users u 
    WHERE u.id = p.id
);

-- Make role required
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL;

-- Create role validation function
CREATE OR REPLACE FUNCTION ensure_valid_role()
RETURNS TRIGGER AS $$
BEGIN
    NEW.role = LOWER(NEW.role::text)::user_role;
    IF NEW.role IS NULL THEN
        NEW.role = 'dealer'::user_role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
CREATE TRIGGER validate_role_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_valid_role();

-- Add role constraint
ALTER TABLE profiles 
ADD CONSTRAINT valid_role_values 
CHECK (role IN ('dealer', 'admin'));

-- Create metadata sync function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_auth_metadata() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role::text)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add metadata sync trigger
DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON profiles;
CREATE TRIGGER sync_auth_metadata_trigger
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_metadata();

-- Add role index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
