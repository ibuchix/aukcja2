-- Fix the current_bid field for the Skoda auction first
UPDATE cars 
SET current_bid = (
  SELECT MAX(amount) 
  FROM bids 
  WHERE bids.car_id = cars.id 
    AND bids.status = 'active'
)
WHERE id = '7a1b25df-9f74-4971-8ad9-160e57cbad3c';

-- Create a function to properly update current_bid when bids are placed
CREATE OR REPLACE FUNCTION update_car_current_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the car's current_bid to the highest active bid
  UPDATE cars 
  SET current_bid = (
    SELECT COALESCE(MAX(amount), 0)
    FROM bids 
    WHERE car_id = NEW.car_id 
      AND status = 'active'
  ),
  updated_at = NOW()
  WHERE id = NEW.car_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update current_bid when bids are inserted or updated
DROP TRIGGER IF EXISTS trigger_update_car_current_bid ON bids;
CREATE TRIGGER trigger_update_car_current_bid
  AFTER INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_car_current_bid();