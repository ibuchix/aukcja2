
-- Add 'active' to the auction_schedule_status enum
-- This will allow the update_auction_status function to work without enum violations

DO $$ 
BEGIN
    -- Add 'active' value to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'active' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auction_schedule_status')
    ) THEN
        ALTER TYPE auction_schedule_status ADD VALUE 'active';
    END IF;
END $$;

-- Fix currently stuck auction schedules that should be active right now
-- Update auction schedules that are between start_time and end_time to 'active' status
UPDATE auction_schedules 
SET 
    status = 'active'::auction_schedule_status,
    last_status_change = NOW(),
    updated_at = NOW()
WHERE status = 'scheduled'::auction_schedule_status
  AND start_time <= NOW()
  AND end_time >= NOW();

-- Log the immediate status correction
INSERT INTO system_logs (
    log_type,
    message,
    details
) VALUES (
    'auction_status_correction',
    'Fixed stuck auction schedules by adding active enum and updating statuses',
    jsonb_build_object(
        'updated_schedules', (
            SELECT COUNT(*) 
            FROM auction_schedules 
            WHERE status = 'active'::auction_schedule_status
        ),
        'timestamp', NOW()
    )
);

-- Update the update_auction_status function to use 'active' instead of causing enum errors
CREATE OR REPLACE FUNCTION public.update_auction_status()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Update auction schedules to active status when they should be running
  UPDATE auction_schedules
  SET 
    status = 'active'::auction_schedule_status,
    last_status_change = NOW(),
    updated_at = NOW()
  WHERE status = 'scheduled'::auction_schedule_status
    AND start_time <= NOW()
    AND end_time >= NOW();
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update auction schedules to completed when they have ended
  UPDATE auction_schedules
  SET 
    status = 'completed'::auction_schedule_status,
    last_status_change = NOW(),
    updated_at = NOW()
  WHERE status = 'active'::auction_schedule_status
    AND end_time < NOW();
  
  -- Also update cars table auction_status to match
  UPDATE cars
  SET 
    auction_status = 'active',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'active'::auction_schedule_status
  )
  AND auction_status != 'active';
  
  -- Mark ended auctions
  UPDATE cars
  SET 
    auction_status = 'ended',
    updated_at = NOW()
  WHERE id IN (
    SELECT car_id 
    FROM auction_schedules 
    WHERE status = 'completed'::auction_schedule_status
  )
  AND auction_status = 'active';
  
  RETURN v_updated_count;
EXCEPTION WHEN OTHERS THEN
  -- Log the error instead of failing silently
  INSERT INTO system_logs (
    log_type,
    message,
    error_message
  ) VALUES (
    'auction_status_update_error',
    'Error in update_auction_status function',
    SQLERRM
  );
  
  RETURN 0;
END;
$$;
