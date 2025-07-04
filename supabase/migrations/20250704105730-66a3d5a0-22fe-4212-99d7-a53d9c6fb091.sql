-- Update BMW M8 record with correct payment information
UPDATE public.dealer_won_vehicles 
SET 
  stripe_payment_intent_id = 'pi_3Rh6B603JxSEuYTK1I6WYkEO',
  payment_status = 'paid',
  payment_date = NOW(),
  seller_details_unlocked = true,
  updated_at = NOW()
WHERE 
  vehicle_make = 'BMW' 
  AND vehicle_model = 'M8' 
  AND payment_status = 'pending'
  AND stripe_payment_intent_id IS NULL;