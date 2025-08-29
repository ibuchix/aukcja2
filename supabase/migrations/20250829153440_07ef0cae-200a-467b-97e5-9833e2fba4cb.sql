
-- Reset the 2021 BMW 5-Series to correct payment status for testing
-- This vehicle was incorrectly marked as paid without actual Stripe payment

UPDATE dealer_won_vehicles 
SET 
  payment_status = 'payment_required',
  seller_details_unlocked = false,
  payment_date = NULL,
  updated_at = NOW()
WHERE id = '122db459-ac77-4267-bfd5-cdbc108aef6c'
  AND car_id = '4ac2c6ac-65a0-41a7-a71e-c74a98504303'
  AND vehicle_year = 2021
  AND vehicle_make = 'BMW'
  AND vehicle_model = '5-SERIES';

-- Add a log entry to track this correction
INSERT INTO system_logs (
  log_type,
  message,
  details
) VALUES (
  'payment_status_correction',
  'Reset incorrectly marked paid status for security testing',
  jsonb_build_object(
    'vehicle_id', '122db459-ac77-4267-bfd5-cdbc108aef6c',
    'car_id', '4ac2c6ac-65a0-41a7-a71e-c74a98504303',
    'vehicle', '2021 BMW 5-SERIES',
    'dealer', 'SOLAMA',
    'reason', 'Vehicle was marked as paid without Stripe payment_intent_id',
    'corrected_at', NOW()
  )
);
