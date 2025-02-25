
-- Create or replace role validation function
CREATE OR REPLACE FUNCTION ensure_valid_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure role is valid
    NEW.role = COALESCE(NEW.role, 'dealer')::user_role;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Default to dealer role if there's any error
        NEW.role = 'dealer'::user_role;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace metadata sync function
CREATE OR REPLACE FUNCTION sync_auth_metadata() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data::jsonb, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role::text)
    WHERE id = NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON profiles;

-- Create new triggers
CREATE TRIGGER validate_role_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_valid_role();

CREATE TRIGGER sync_auth_metadata_trigger
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_metadata();
