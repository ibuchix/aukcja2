-- One-time cleanup to fix existing duplicate active bids
-- This will mark older active bids as 'outbid', keeping only the most recent bid per dealer per car

UPDATE bids 
SET status = 'outbid'
WHERE id IN (
  -- Find all active bids that are NOT the most recent for each dealer-car combination
  SELECT b1.id
  FROM bids b1
  WHERE b1.status = 'active'
    AND EXISTS (
      -- Check if there's a more recent active bid from the same dealer for the same car
      SELECT 1 
      FROM bids b2 
      WHERE b2.car_id = b1.car_id 
        AND b2.dealer_id = b1.dealer_id 
        AND b2.status = 'active'
        AND b2.created_at > b1.created_at
    )
);

-- Log the cleanup operation
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'data_cleanup', 
  'Cleaned up duplicate active bids', 
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Marked older active bids as outbid, keeping only most recent bid per dealer per car'
  )
);