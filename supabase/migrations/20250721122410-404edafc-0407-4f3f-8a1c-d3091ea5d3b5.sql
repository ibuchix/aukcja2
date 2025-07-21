-- Test the trigger by updating the existing seller decision record
-- This should trigger the function and update the payment status
UPDATE seller_bid_decisions 
SET updated_at = NOW()
WHERE car_id = '7025868a-de8d-423e-9e30-eddcac23b7af' 
  AND decision = 'accepted';

-- Also check system logs to see if the trigger fires
INSERT INTO system_logs (
  log_type,
  message,
  details
) VALUES (
  'trigger_test',
  'Manually triggered seller decision update to test trigger',
  jsonb_build_object(
    'car_id', '7025868a-de8d-423e-9e30-eddcac23b7af',
    'timestamp', NOW()
  )
);