-- Check if auction_activity_stats is a view and get its definition
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'auction_activity_stats';

-- Also check what tables this view might be based on
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'auction_activity_stats';