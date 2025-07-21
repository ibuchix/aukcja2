-- Drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_send_email_on_seller_accept ON seller_bid_decisions;

-- Recreate the trigger properly
CREATE TRIGGER trigger_send_email_on_seller_accept
  AFTER INSERT OR UPDATE ON seller_bid_decisions
  FOR EACH ROW
  EXECUTE FUNCTION send_email_on_seller_accept();

-- Test the trigger exists
INSERT INTO system_logs (
  log_type,
  message,
  details
) VALUES (
  'trigger_recreation',
  'Recreated trigger_send_email_on_seller_accept',
  jsonb_build_object('timestamp', NOW())
);