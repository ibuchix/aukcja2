
CREATE OR REPLACE FUNCTION public.get_seller_contact_for_dealer(_car_id uuid)
RETURNS TABLE (
  seller_name text,
  contact_email text,
  mobile_number text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_active boolean;
  v_live boolean;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT public.dealer_has_active_subscription(v_user) INTO v_active;
  IF NOT v_active THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.auction_schedules s
    WHERE s.car_id = _car_id
      AND s.status = 'active'
      AND now() BETWEEN s.start_time AND s.end_time
  ) INTO v_live;

  IF NOT v_live THEN
    -- fallback: trust cars.auction_status = 'active' AND end_time in future
    SELECT EXISTS (
      SELECT 1 FROM public.cars c
      WHERE c.id = _car_id
        AND c.auction_status = 'active'
        AND (c.auction_end_time IS NULL OR c.auction_end_time > now())
    ) INTO v_live;
  END IF;

  IF NOT v_live THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.seller_name, c.contact_email, c.mobile_number
  FROM public.cars c
  WHERE c.id = _car_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_contact_for_dealer(uuid) TO authenticated;
