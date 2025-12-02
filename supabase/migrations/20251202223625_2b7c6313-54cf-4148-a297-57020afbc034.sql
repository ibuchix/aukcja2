-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.cars_public_view;

-- Recreate with SECURITY INVOKER (PostgreSQL 15+) so queries run with the calling user's permissions
CREATE VIEW public.cars_public_view
WITH (security_barrier = true)
AS
SELECT 
    c.id,
    c.title,
    c.make,
    c.model,
    c.year,
    c.mileage,
    c.transmission,
    c.fuel_type,
    c.features,
    c.images,
    c.required_photos,
    c.additional_photos,
    c.rim_photos,
    c.is_auction,
    c.auction_status,
    c.auction_end_time,
    c.current_bid,
    c.reserve_price,
    c.minimum_bid_increment,
    c.is_damaged,
    c.is_registered_in_poland,
    c.has_outstanding_finance,
    c.finance_amount,
    c.finance_document_url,
    c.finance_document_name,
    c.finance_document_uploaded_at,
    c.has_service_history,
    c.service_history_type,
    c.has_full_registration_document,
    c.number_of_keys,
    c.seat_material,
    c.seller_notes,
    c.seller_id,
    c.status,
    c.created_at,
    c.updated_at,
    c.last_saved,
    c.vin,
    c.registration_number,
    c.is_manually_controlled,
    c.auction_scheduled,
    c.awaiting_seller_decision,
    c.email_notification_sent,
    c.is_selling_on_behalf,
    c.form_metadata,
    c.valuation_data,
    -- Masked seller information - only show to admins, the seller, or dealers who paid
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.seller_name
        WHEN c.seller_id = auth.uid() THEN c.seller_name
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.seller_name
        ELSE NULL
    END AS seller_name,
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.mobile_number
        WHEN c.seller_id = auth.uid() THEN c.mobile_number
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.mobile_number
        ELSE NULL
    END AS mobile_number,
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.street_address
        WHEN c.seller_id = auth.uid() THEN c.street_address
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.street_address
        ELSE NULL
    END AS street_address,
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.town
        WHEN c.seller_id = auth.uid() THEN c.town
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.town
        ELSE NULL
    END AS town,
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.county
        WHEN c.seller_id = auth.uid() THEN c.county
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.county
        ELSE NULL
    END AS county,
    CASE 
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN c.postcode
        WHEN c.seller_id = auth.uid() THEN c.postcode
        WHEN public.has_paid_for_vehicle(auth.uid(), c.id) THEN c.postcode
        ELSE NULL
    END AS postcode
FROM public.cars c;

-- Set SECURITY INVOKER (PostgreSQL 15+)
ALTER VIEW public.cars_public_view SET (security_invoker = true);

-- Grant SELECT to authenticated users only
REVOKE ALL ON public.cars_public_view FROM PUBLIC;
GRANT SELECT ON public.cars_public_view TO authenticated;

-- Add comment explaining purpose
COMMENT ON VIEW public.cars_public_view IS 'Security view that masks seller personal information. Uses SECURITY INVOKER so RLS on cars table is respected. Seller details only visible to admins, the seller themselves, or dealers who have paid for the vehicle.';