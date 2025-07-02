-- Grant permissions more explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dealer_won_vehicles TO authenticator;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dealer_won_vehicles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Check if the table exists and is accessible
SELECT count(*) as record_count FROM public.dealer_won_vehicles;