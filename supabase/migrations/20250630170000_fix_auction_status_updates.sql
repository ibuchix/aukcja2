
-- Create missing database functions for auction status management

-- Function to start scheduled auctions
CREATE OR REPLACE FUNCTION public.start_scheduled_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_count INTEGER := 0;
  v_current_time TIMESTAMPTZ := NOW();
BEGIN
  -- Update auction schedules from 'scheduled' to 'running' when start time has passed
  UPDATE public.auction_schedules
  SET 
    status = 'running',
    last_status_change = v_current_time,
    updated_at = v_current_time
  WHERE status = 'scheduled'
    AND start_time <= v_current_time
    AND end_time > v_current_time;
  
  GET DIAGNOSTICS v_started_count = ROW_COUNT;
  
  -- Also update corresponding car auction statuses
  IF v_started_count > 0 THEN
    UPDATE public.cars
    SET 
      auction_status = 'active',
      updated_at = v_current_time
    WHERE id IN (
      SELECT car_id 
      FROM public.auction_schedules 
      WHERE status = 'running' 
        AND start_time <= v_current_time
        AND end_time > v_current_time
    )
    AND auction_status != 'active';
  END IF;
  
  -- Log the operation
  INSERT INTO public.system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_update',
    'Started scheduled auctions',
    jsonb_build_object(
      'auctions_started', v_started_count,
      'timestamp', v_current_time
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'auctions_started', v_started_count,
    'timestamp', v_current_time
  );
END;
$$;

-- Function to complete scheduled auctions
CREATE OR REPLACE FUNCTION public.complete_scheduled_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count INTEGER := 0;
  v_current_time TIMESTAMPTZ := NOW();
BEGIN
  -- Update auction schedules from 'running' to 'completed' when end time has passed
  UPDATE public.auction_schedules
  SET 
    status = 'completed',
    last_status_change = v_current_time,
    updated_at = v_current_time
  WHERE status = 'running'
    AND end_time <= v_current_time;
  
  GET DIAGNOSTICS v_completed_count = ROW_COUNT;
  
  -- Update corresponding car auction statuses to 'ended'
  IF v_completed_count > 0 THEN
    UPDATE public.cars
    SET 
      auction_status = 'ended',
      updated_at = v_current_time
    WHERE id IN (
      SELECT car_id 
      FROM public.auction_schedules 
      WHERE status = 'completed'
    )
    AND auction_status = 'active';
  END IF;
  
  -- Log the operation
  INSERT INTO public.system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_status_update',
    'Completed scheduled auctions',
    jsonb_build_object(
      'auctions_completed', v_completed_count,
      'timestamp', v_current_time
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'auctions_completed', v_completed_count,
    'timestamp', v_current_time
  );
END;
$$;

-- Function to close ended auctions and process results
CREATE OR REPLACE FUNCTION public.close_ended_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_sold_count INTEGER := 0;
  v_current_time TIMESTAMPTZ := NOW();
  auction_record RECORD;
  highest_bid_record RECORD;
BEGIN
  -- Process cars with ended auction status that haven't been processed yet
  FOR auction_record IN (
    SELECT c.id, c.current_bid, c.reserve_price, c.title
    FROM public.cars c
    JOIN public.auction_schedules asch ON c.id = asch.car_id
    WHERE c.auction_status = 'ended'
      AND asch.status = 'completed'
      AND c.updated_at > v_current_time - INTERVAL '1 hour'
  ) LOOP
    
    -- Find the highest bid for this auction
    SELECT b.id, b.dealer_id, b.amount
    INTO highest_bid_record
    FROM public.bids b
    WHERE b.car_id = auction_record.id
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;
    
    -- Determine if auction was sold (reserve price met)
    IF highest_bid_record.amount IS NOT NULL AND 
       highest_bid_record.amount >= auction_record.reserve_price THEN
      
      -- Mark car as sold
      UPDATE public.cars
      SET auction_status = 'sold'
      WHERE id = auction_record.id;
      
      -- Mark winning bid
      UPDATE public.bids
      SET status = 'won'
      WHERE id = highest_bid_record.id;
      
      -- Mark all other bids as lost
      UPDATE public.bids
      SET status = 'lost'
      WHERE car_id = auction_record.id
        AND id != highest_bid_record.id;
      
      v_sold_count := v_sold_count + 1;
    ELSE
      -- Mark all bids as lost (reserve not met)
      UPDATE public.bids
      SET status = 'lost'
      WHERE car_id = auction_record.id;
    END IF;
    
    v_processed_count := v_processed_count + 1;
  END LOOP;
  
  -- Log the operation
  INSERT INTO public.system_logs (
    log_type, 
    message, 
    details
  ) VALUES (
    'auction_results_processing',
    'Processed ended auctions',
    jsonb_build_object(
      'auctions_processed', v_processed_count,
      'auctions_sold', v_sold_count,
      'timestamp', v_current_time
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'auctions_processed', v_processed_count,
    'auctions_sold', v_sold_count,
    'timestamp', v_current_time
  );
END;
$$;

-- Enhanced function to get live auction schedules with proper filtering
CREATE OR REPLACE FUNCTION public.get_live_auction_schedules()
RETURNS TABLE(
  car_id uuid,
  status text,
  start_time timestamptz,
  end_time timestamptz,
  is_manually_controlled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    asch.car_id,
    asch.status,
    asch.start_time,
    asch.end_time,
    asch.is_manually_controlled
  FROM public.auction_schedules asch
  JOIN public.cars c ON asch.car_id = c.id
  WHERE asch.status IN ('running', 'scheduled')
    AND c.auction_status = 'active'
    AND c.is_auction = true
    -- Include scheduled auctions that start within the next hour
    AND (
      (asch.status = 'running' AND asch.end_time > NOW())
      OR
      (asch.status = 'scheduled' AND asch.start_time <= NOW() + INTERVAL '1 hour')
    )
  ORDER BY asch.start_time ASC;
END;
$$;

-- Function to manually trigger auction status updates (for testing)
CREATE OR REPLACE FUNCTION public.manual_auction_status_update()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_result jsonb;
  v_complete_result jsonb;
  v_close_result jsonb;
BEGIN
  -- Start scheduled auctions
  SELECT public.start_scheduled_auctions() INTO v_start_result;
  
  -- Complete ended auctions
  SELECT public.complete_scheduled_auctions() INTO v_complete_result;
  
  -- Close and process ended auctions
  SELECT public.close_ended_auctions() INTO v_close_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'start_result', v_start_result,
    'complete_result', v_complete_result,
    'close_result', v_close_result,
    'executed_at', NOW()
  );
END;
$$;

-- Add missing columns to auction_schedules if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'auction_schedules' 
    AND column_name = 'last_status_change'
  ) THEN
    ALTER TABLE public.auction_schedules 
    ADD COLUMN last_status_change TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auction_schedules_status_times 
ON public.auction_schedules (status, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_cars_auction_timing 
ON public.cars (auction_status, updated_at) 
WHERE is_auction = true;

-- Set up cron jobs to run auction status updates every minute
-- Note: These require pg_cron extension to be enabled
SELECT cron.schedule(
  'update-auction-status',
  '* * * * *', -- Every minute
  $$
  SELECT public.manual_auction_status_update();
  $$
);

-- Also set up the edge function trigger as backup
SELECT cron.schedule(
  'trigger-auction-outcomes-edge-function',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/update-auction-outcomes',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc5MjU5MSwiZXhwIjoyMDUwMzY4NTkxfQ.LGJJKiuIcPNkRWlmhgQs8Q5CqRg1KNzAHOGMq0Sf8Qg"}'::jsonb,
      body := '{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);
