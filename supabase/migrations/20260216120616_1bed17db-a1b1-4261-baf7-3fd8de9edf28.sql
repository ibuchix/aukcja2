
-- Create dealer_reviews table
CREATE TABLE public.dealer_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  car_id uuid NOT NULL REFERENCES public.cars(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  dealer_name text,
  car_title text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one review per dealer per car
ALTER TABLE public.dealer_reviews ADD CONSTRAINT dealer_reviews_dealer_car_unique UNIQUE (dealer_id, car_id);

-- Enable RLS
ALTER TABLE public.dealer_reviews ENABLE ROW LEVEL SECURITY;

-- Dealers can insert their own reviews
CREATE POLICY "Dealers can insert own reviews"
ON public.dealer_reviews FOR INSERT
WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- Dealers can view their own reviews
CREATE POLICY "Dealers can view own reviews"
ON public.dealer_reviews FOR SELECT
USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));

-- Anyone authenticated can read approved reviews (for home page)
CREATE POLICY "Anyone can read approved reviews"
ON public.dealer_reviews FOR SELECT
USING (status = 'approved');

-- Admins have full access
CREATE POLICY "Admins full access dealer reviews"
ON public.dealer_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
