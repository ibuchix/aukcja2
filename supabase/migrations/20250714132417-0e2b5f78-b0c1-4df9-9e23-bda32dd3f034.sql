-- Fix payment_status constraint first
ALTER TABLE dealer_won_vehicles DROP CONSTRAINT IF EXISTS dealer_won_vehicles_payment_status_check;

-- Add new constraint with awaiting_seller_decision status
ALTER TABLE dealer_won_vehicles ADD CONSTRAINT dealer_won_vehicles_payment_status_check 
CHECK (payment_status IN ('awaiting_seller_decision', 'payment_required', 'paid', 'pending'));

-- Now update the status
UPDATE dealer_won_vehicles 
SET payment_status = 'awaiting_seller_decision' 
WHERE payment_status = 'pending' 
AND seller_details_unlocked = false;