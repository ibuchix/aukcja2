-- Fix Mercedes E-Class payment status to reflect actual unpaid state
UPDATE public.dealer_won_vehicles 
SET 
  payment_status = 'pending',
  seller_details_unlocked = false,
  stripe_payment_intent_id = NULL,
  payment_date = NULL,
  updated_at = NOW()
WHERE 
  vehicle_make = 'Mercedes-Benz' 
  AND vehicle_model = 'E-Class' 
  AND (payment_status = 'paid' OR seller_details_unlocked = true);