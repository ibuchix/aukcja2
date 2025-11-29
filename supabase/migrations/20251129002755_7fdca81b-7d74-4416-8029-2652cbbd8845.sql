-- Create dealer_wishlists table
CREATE TABLE dealer_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- Prevent duplicate entries
  UNIQUE(dealer_id, car_id)
);

-- Enable RLS
ALTER TABLE dealer_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Dealers can view their own wishlist
CREATE POLICY "Dealers can view their own wishlist"
  ON dealer_wishlists FOR SELECT
  USING (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Dealers can add to their own wishlist"
  ON dealer_wishlists FOR INSERT
  WITH CHECK (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Dealers can remove from their own wishlist"
  ON dealer_wishlists FOR DELETE
  USING (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

-- Admin access
CREATE POLICY "Admins can manage all wishlists"
  ON dealer_wishlists FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create indexes for performance
CREATE INDEX idx_dealer_wishlists_dealer_id ON dealer_wishlists(dealer_id);
CREATE INDEX idx_dealer_wishlists_expires_at ON dealer_wishlists(expires_at);
CREATE INDEX idx_dealer_wishlists_car_id ON dealer_wishlists(car_id);

-- Automatic cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_wishlists()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM dealer_wishlists 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;