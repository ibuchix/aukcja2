-- Fix search_path for all public schema functions to prevent search_path manipulation attacks
-- This is a security hardening measure for both SECURITY DEFINER and SECURITY INVOKER functions
-- Note: Excludes test_admin_policies as it's owned by a different user

-- SECURITY DEFINER functions (highest priority - run with elevated privileges)
ALTER FUNCTION public.cleanup_expired_wishlists() SET search_path = public;
ALTER FUNCTION public.create_simple_car_listing(jsonb, uuid) SET search_path = public;
ALTER FUNCTION public.create_simple_manual_valuation(jsonb, uuid) SET search_path = public;
ALTER FUNCTION public.debug_auction_schedules_access() SET search_path = public;
ALTER FUNCTION public.detect_suspicious_stats_access() SET search_path = public;
ALTER FUNCTION public.extend_auction_time(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION public.is_admin_user(uuid) SET search_path = public;
ALTER FUNCTION public.manual_auction_status_update() SET search_path = public;
ALTER FUNCTION public.process_seller_auction_end() SET search_path = public;
ALTER FUNCTION public.record_system_health_metric(text, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.reject_listing(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.reset_upload_rate_limits(uuid) SET search_path = public;
ALTER FUNCTION public.send_email_on_seller_accept() SET search_path = public;
ALTER FUNCTION public.set_temp_uploads_data(jsonb) SET search_path = public;
ALTER FUNCTION public.update_auction_status() SET search_path = public;
ALTER FUNCTION public.update_car_auction_times_from_schedule() SET search_path = public;
ALTER FUNCTION public.update_seller_active_listings() SET search_path = public;
ALTER FUNCTION public.update_system_health(text, system_component_health, jsonb) SET search_path = public;
ALTER FUNCTION public.update_won_vehicle_payment_status() SET search_path = public;
ALTER FUNCTION public.upsert_car_listing(jsonb, boolean) SET search_path = public;
ALTER FUNCTION public.verify_password(uuid, text) SET search_path = public;

-- SECURITY INVOKER functions (still important for consistency and security)
ALTER FUNCTION public.calculate_reserve_price(numeric) SET search_path = public;
ALTER FUNCTION public.calculate_reserve_price_from_min_med(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.ensure_valid_role() SET search_path = public;
ALTER FUNCTION public.get_auction_timing_status(timestamptz, timestamptz, text) SET search_path = public;
ALTER FUNCTION public.get_correct_auction_status(timestamptz, timestamptz, auction_schedule_status) SET search_path = public;
ALTER FUNCTION public.is_admin_from_jwt() SET search_path = public;
ALTER FUNCTION public.log_car_image_status_change() SET search_path = public;
ALTER FUNCTION public.set_awaiting_seller_decision_on_auction_end() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.update_auction_results_updated_at() SET search_path = public;
ALTER FUNCTION public.update_car_current_bid() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.validate_and_normalize_phone(text) SET search_path = public;
ALTER FUNCTION public.validate_polish_nip(text) SET search_path = public;