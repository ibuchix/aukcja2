-- Check if the function exists and recreate the trigger
CREATE TRIGGER trigger_send_email_on_seller_accept
  AFTER INSERT OR UPDATE ON seller_bid_decisions
  FOR EACH ROW
  EXECUTE FUNCTION send_email_on_seller_accept();