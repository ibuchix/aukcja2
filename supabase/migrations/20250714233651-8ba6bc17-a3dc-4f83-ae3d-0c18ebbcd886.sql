-- Fix the BMW Series 5 auction to make it appear on dealer dashboard
UPDATE cars 
SET 
  is_auction = true,
  auction_status = 'active',
  updated_at = NOW()
WHERE id = '9354876a-c666-448e-a753-ee2e7e13e98a';

-- Update the auction schedule status to running
UPDATE auction_schedules 
SET 
  status = 'running',
  last_status_change = NOW(),
  updated_at = NOW()
WHERE car_id = '9354876a-c666-448e-a753-ee2e7e13e98a';

-- Log the manual fix
INSERT INTO system_logs (
  log_type, 
  message, 
  details
) VALUES (
  'manual_auction_fix', 
  'Manually fixed BMW Series 5 auction to appear on dealer dashboard', 
  jsonb_build_object(
    'car_id', '9354876a-c666-448e-a753-ee2e7e13e98a',
    'changes', 'Set is_auction=true, auction_status=active, schedule_status=running'
  )
);