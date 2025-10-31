-- Create security definer function to check if dealer has paid for vehicle
CREATE OR REPLACE FUNCTION public.has_paid_for_vehicle(_dealer_user_id uuid, _car_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM dealer_won_vehicles dwv
    JOIN dealers d ON d.id = dwv.dealer_id
    WHERE d.user_id = _dealer_user_id
      AND dwv.car_id = _car_id
      AND dwv.payment_status = 'paid'
      AND dwv.seller_details_unlocked = true
  )
$$;

-- Create masked view that protects seller personal information
CREATE OR REPLACE VIEW cars_public_view AS
SELECT 
  c.id,
  c.title,
  c.make,
  c.model,
  c.year,
  c.mileage,
  c.fuel_type,
  c.transmission,
  c.vin,
  c.images,
  c.features,
  c.is_damaged,
  c.is_registered_in_poland,
  c.has_service_history,
  c.service_history_type,
  c.seat_material,
  c.number_of_keys,
  c.has_full_registration_document,
  c.has_outstanding_finance,
  c.finance_amount,
  c.finance_document_url,
  c.finance_document_name,
  c.finance_document_uploaded_at,
  c.is_selling_on_behalf,
  c.reserve_price,
  c.current_bid,
  c.minimum_bid_increment,
  c.auction_status,
  c.auction_end_time,
  c.is_auction,
  c.auction_scheduled,
  c.is_manually_controlled,
  c.awaiting_seller_decision,
  c.status,
  c.valuation_data,
  c.form_metadata,
  c.additional_photos,
  c.rim_photos,
  c.required_photos,
  c.seller_notes,
  c.registration_number,
  c.email_notification_sent,
  c.created_at,
  c.updated_at,
  c.last_saved,
  c.seller_id,
  -- Mask seller personal details unless user is seller, paid dealer, or admin
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.seller_name
    ELSE '***HIDDEN***'
  END AS seller_name,
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.mobile_number
    ELSE NULL
  END AS mobile_number,
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.street_address
    ELSE NULL
  END AS street_address,
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.town
    ELSE NULL
  END AS town,
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.county
    ELSE NULL
  END AS county,
  CASE 
    WHEN c.seller_id = auth.uid() 
      OR public.has_paid_for_vehicle(auth.uid(), c.id)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    THEN c.postcode
    ELSE NULL
  END AS postcode
FROM cars c;

-- Grant access to the view for authenticated users
GRANT SELECT ON cars_public_view TO authenticated;

-- Enable security barrier for additional protection
ALTER VIEW cars_public_view SET (security_barrier = true);

-- Add helpful comment
COMMENT ON VIEW cars_public_view IS 'Masked view of cars table that protects seller personal information (name, phone, address) until dealer has paid platform fee and unlocked seller details';