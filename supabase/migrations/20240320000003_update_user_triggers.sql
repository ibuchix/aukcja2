
-- Create or replace user handler function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _role user_role;
BEGIN
    -- Safely convert role from metadata
    BEGIN
        _role := COALESCE(NEW.raw_user_meta_data->>'role', 'dealer')::user_role;
    EXCEPTION WHEN OTHERS THEN
        _role := 'dealer'::user_role;
    END;

    -- Insert the profile with error handling
    BEGIN
        INSERT INTO public.profiles (
            id,
            role,
            full_name,
            updated_at
        )
        VALUES (
            NEW.id,
            _role,
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        -- Profile already exists, ignore
        NULL;
    WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
