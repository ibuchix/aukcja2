
-- Create index on dealers.user_id
CREATE INDEX IF NOT EXISTS dealers_user_id_idx ON dealers(user_id);

-- Create index on profiles.email 
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
