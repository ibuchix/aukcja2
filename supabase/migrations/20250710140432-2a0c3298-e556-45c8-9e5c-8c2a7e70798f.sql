-- Fix Mercedes E-Class payment status with correct case matching
UPDATE public.dealer_won_vehicles 
SET 
  payment_status = 'pending',
  seller_details_unlocked = false,
  stripe_payment_intent_id = NULL,
  payment_date = NULL,
  updated_at = NOW()
WHERE 
  vehicle_make ILIKE '%MERCEDES%' 
  AND vehicle_model ILIKE '%E-CLASS%' 
  AND (payment_status = 'paid' OR seller_details_unlocked = true);