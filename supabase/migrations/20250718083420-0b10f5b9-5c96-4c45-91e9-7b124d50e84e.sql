-- Manually fix the Skoda auction status that should be running
UPDATE auction_schedules 
SET status = 'running',
    last_status_change = NOW()
WHERE car_id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef'
  AND status = 'scheduled'
  AND start_time <= NOW()
  AND end_time >= NOW();

-- Also make sure the car auction status is active
UPDATE cars 
SET auction_status = 'active'
WHERE id = 'd7bc1824-5a11-4c71-9745-1d41a644f4ef';