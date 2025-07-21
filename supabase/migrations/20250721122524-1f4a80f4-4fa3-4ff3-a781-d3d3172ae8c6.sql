-- Test the trigger by updating the existing seller decision record
UPDATE seller_bid_decisions 
SET updated_at = NOW()
WHERE car_id = '7025868a-de8d-423e-9e30-eddcac23b7af' 
  AND decision = 'accepted';