
-- Add indexes for better performance when filtering live auctions
CREATE INDEX IF NOT EXISTS idx_auction_schedules_status_timing 
ON auction_schedules (status, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_auction_schedules_car_id_status 
ON auction_schedules (car_id, status);

-- Add index on cars table for auction filtering
CREATE INDEX IF NOT EXISTS idx_cars_auction_status 
ON cars (is_auction, auction_status) WHERE is_auction = true;

-- Create a function to calculate auction timing status server-side
CREATE OR REPLACE FUNCTION get_auction_timing_status(
  schedule_start_time timestamptz,
  schedule_end_time timestamptz,
  schedule_status text
) RETURNS text AS $$
BEGIN
  -- Return 'unknown' if required times are missing
  IF schedule_start_time IS NULL OR schedule_end_time IS NULL THEN
    RETURN 'unknown';
  END IF;

  -- Check if auction has ended (past end time)
  IF NOW() > schedule_end_time THEN
    RETURN 'ended';
  END IF;
  
  -- Check if auction is currently running (between start and end time)
  IF NOW() >= schedule_start_time AND NOW() <= schedule_end_time THEN
    RETURN 'running';
  END IF;
  
  -- Check if auction is scheduled for the future (before start time)
  IF NOW() < schedule_start_time THEN
    RETURN 'scheduled';
  END IF;
  
  RETURN 'unknown';
END;
$$ LANGUAGE plpgsql STABLE;
