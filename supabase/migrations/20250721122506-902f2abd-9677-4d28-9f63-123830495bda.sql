-- Fix the trigger function to get email from auth.users instead of dealers table
CREATE OR REPLACE FUNCTION public.send_email_on_seller_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_dealer_email text;
  v_dealer_name text;
  v_car_details record;
  v_won_vehicle record;
BEGIN
  -- Only process if decision is 'accepted'
  IF NEW.decision = 'accepted' THEN
    
    -- CRITICAL: Update the dealer_won_vehicles payment status first
    UPDATE dealer_won_vehicles 
    SET payment_status = 'payment_required',
        updated_at = NOW()
    WHERE car_id = NEW.car_id;
    
    -- Get dealer email from auth.users and dealership name from dealers
    SELECT 
      au.email,
      d.dealership_name
    INTO v_dealer_email, v_dealer_name
    FROM dealers d
    JOIN auth.users au ON d.user_id = au.id
    WHERE d.id = NEW.highest_bid_dealer_id;
    
    -- Get car details
    SELECT 
      c.make,
      c.model,
      c.year,
      c.id
    INTO v_car_details
    FROM cars c
    WHERE c.id = NEW.car_id;
    
    -- Get won vehicle details for winning bid amount
    SELECT 
      dwv.winning_bid_amount
    INTO v_won_vehicle
    FROM dealer_won_vehicles dwv
    WHERE dwv.car_id = NEW.car_id;
    
    -- Call the email sending function via HTTP
    PERFORM net.http_post(
      url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/send-dealer-bid-accepted',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M"}'::jsonb,
      body := jsonb_build_object(
        'dealerId', NEW.highest_bid_dealer_id,
        'carId', NEW.car_id,
        'winningBid', v_won_vehicle.winning_bid_amount,
        'vehicleDetails', jsonb_build_object(
          'make', v_car_details.make,
          'model', v_car_details.model,
          'year', v_car_details.year
        ),
        'dealerEmail', v_dealer_email,
        'dealershipName', COALESCE(v_dealer_name, 'Dear Dealer')
      )
    );
    
    -- Log the payment status update and email sending attempt
    INSERT INTO system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'seller_accept_processing',
      'Updated payment status and sent email for seller bid acceptance',
      jsonb_build_object(
        'car_id', NEW.car_id,
        'dealer_id', NEW.highest_bid_dealer_id,
        'dealer_email', v_dealer_email,
        'payment_status_updated', true
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;