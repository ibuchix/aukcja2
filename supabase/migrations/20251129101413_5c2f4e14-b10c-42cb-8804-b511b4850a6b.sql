-- Grant table permissions to authenticated users for dealer_wishlists
-- RLS policies already ensure only dealers can access their own wishlist items
GRANT SELECT, INSERT, DELETE ON public.dealer_wishlists TO authenticated;

-- Grant usage on sequences for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;