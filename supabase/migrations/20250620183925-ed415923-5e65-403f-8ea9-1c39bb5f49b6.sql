
-- First, let's see what the current enum values are and update if needed
DO $$ 
BEGIN
    -- Check if the enum type exists and what values it has
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auction_schedule_status') THEN
        -- Add missing values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'running' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auction_schedule_status')) THEN
            ALTER TYPE auction_schedule_status ADD VALUE 'running';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auction_schedule_status')) THEN
            ALTER TYPE auction_schedule_status ADD VALUE 'completed';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auction_schedule_status')) THEN
            ALTER TYPE auction_schedule_status ADD VALUE 'cancelled';
        END IF;
    ELSE
        -- Create the enum if it doesn't exist
        CREATE TYPE auction_schedule_status AS ENUM ('scheduled', 'running', 'completed', 'cancelled');
    END IF;
END $$;

-- Ensure the auction_schedules table uses the correct enum type
ALTER TABLE auction_schedules 
ALTER COLUMN status SET DEFAULT 'scheduled'::auction_schedule_status;
