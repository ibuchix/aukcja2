
-- 1) dealer_subscriptions table
CREATE TABLE public.dealer_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dealer_subscriptions_dealer_unique UNIQUE (dealer_id)
);

CREATE INDEX idx_dealer_subscriptions_user_id ON public.dealer_subscriptions(user_id);
CREATE INDEX idx_dealer_subscriptions_stripe_sub ON public.dealer_subscriptions(stripe_subscription_id);

GRANT SELECT ON public.dealer_subscriptions TO authenticated;
GRANT ALL ON public.dealer_subscriptions TO service_role;

ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own subscription"
  ON public.dealer_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_dealer_subscriptions_updated_at
BEFORE UPDATE ON public.dealer_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) active-subscription check
CREATE OR REPLACE FUNCTION public.dealer_has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dealer_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.dealer_has_active_subscription(UUID) TO authenticated;

-- 3) Seller-contact gated accessor
CREATE OR REPLACE FUNCTION public.get_seller_contact_for_car(_car_id UUID)
RETURNS TABLE(seller_first_name TEXT, seller_email TEXT, seller_phone TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _is_live BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.dealer_has_active_subscription(auth.uid()) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.auction_schedules s
    WHERE s.car_id = _car_id
      AND COALESCE(s.status, '') NOT IN ('cancelled', 'ended', 'completed')
      AND s.start_time <= now()
      AND s.end_time   >= now()
  ) INTO _is_live;

  IF NOT _is_live THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    NULLIF(split_part(COALESCE(s.full_name, ''), ' ', 1), '')::TEXT AS seller_first_name,
    u.email::TEXT AS seller_email,
    s.phone_number::TEXT AS seller_phone
  FROM public.cars c
  JOIN public.sellers s ON s.id = c.seller_id
  JOIN auth.users u ON u.id = s.user_id
  WHERE c.id = _car_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_contact_for_car(UUID) TO authenticated;
