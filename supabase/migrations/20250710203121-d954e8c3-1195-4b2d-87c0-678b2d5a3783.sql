-- Add a recovery function to process any missed auctions
CREATE OR REPLACE FUNCTION public.recover_missed_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_missing_count INTEGER := 0;
  auction_rec RECORD;
BEGIN
  -- Find cars that are "sold" but missing dealer_won_vehicles records
  FOR auction_rec IN (
    SELECT c.id, c.make, c.model, c.current_bid, c.auction_end_time
    FROM cars c
    WHERE c.auction_status = 'sold'
      AND NOT EXISTS (
        SELECT 1 FROM dealer_won_vehicles dwv 
        WHERE dwv.car_id = c.id
      )
  ) LOOP
    
    -- Call the processing function for each missed auction
    PERFORM public.process_specific_ended_auction(auction_rec.id);
    
    v_missing_count := v_missing_count + 1;
    
    -- Log the recovery
    INSERT INTO system_logs (
      log_type, 
      message, 
      details
    ) VALUES (
      'auction_recovery',
      'Recovered missing won vehicle record',
      jsonb_build_object(
        'car_id', auction_rec.id,
        'make', auction_rec.make,
        'model', auction_rec.model,
        'winning_bid', auction_rec.current_bid
      )
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'recovered_auctions', v_missing_count,
    'timestamp', NOW()
  );
END;
$$;

-- Add logging for auction processing events
CREATE TABLE IF NOT EXISTS public.auction_processing_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  processing_type text NOT NULL,
  car_id uuid,
  status text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for the logs table
ALTER TABLE public.auction_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view logs
CREATE POLICY "Admins can view auction processing logs" 
ON public.auction_processing_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  )
);

-- Create policy for system to insert logs
CREATE POLICY "System can insert auction processing logs" 
ON public.auction_processing_logs 
FOR INSERT 
WITH CHECK (true);

-- Run the recovery function once to catch any existing missing records
SELECT public.recover_missed_auctions();