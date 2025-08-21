-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Dealers can view auction car images" ON car_file_uploads;

-- Create a simpler, more reliable policy for verified dealers to view auction car images
CREATE POLICY "Verified dealers can view auction car images" ON car_file_uploads
  FOR SELECT
  USING (
    -- Check if current user is a verified dealer
    EXISTS (
      SELECT 1 FROM dealers 
      WHERE dealers.user_id = auth.uid() 
      AND dealers.is_verified = true
    )
    AND
    -- Check if the car is in auction
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_file_uploads.car_id 
      AND cars.is_auction = true
    )
  );