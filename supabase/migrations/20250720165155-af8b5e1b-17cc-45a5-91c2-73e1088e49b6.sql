-- Add the missing process_ended_auctions_workflow cron job
SELECT cron.schedule(
  'process-ended-auctions-workflow',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT public.process_ended_auctions_workflow();'
);