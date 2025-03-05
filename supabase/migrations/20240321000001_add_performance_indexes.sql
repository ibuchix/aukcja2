
-- Create index on dealers.user_id
CREATE INDEX IF NOT EXISTS dealers_user_id_idx ON dealers(user_id);

-- Add attempts column to dealer_otps if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'dealer_otps' AND column_name = 'attempts'
  ) THEN
    ALTER TABLE dealer_otps ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

