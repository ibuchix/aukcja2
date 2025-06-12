
import { rawSupabaseClient } from "@/integrations/supabase/client";

export const buildCarListingsQuery = () => {
  console.log("Using raw Supabase client for car listings to preserve authentication context");
  
  // Build the base query - this will be guarded by the auth-aware query wrapper
  // so we know auth is ready when this executes
  return rawSupabaseClient
    .from("cars")
    .select(`
      id,
      make,
      model,
      year,
      mileage,
      reserve_price,
      images,
      required_photos,
      title,
      features,
      transmission,
      is_auction,
      auction_end_time,
      minimum_bid_increment,
      auction_status,
      is_damaged,
      address,
      created_at,
      updated_at,
      status,
      current_bid,
      seller_notes,
      service_history_type,
      has_service_history,
      seller_id,
      seller_name,
      mobile_number,
      additional_photos,
      vin,
      seat_material,
      number_of_keys,
      is_registered_in_poland,
      has_private_plate,
      finance_amount,
      form_metadata,
      valuation_data,
      last_saved,
      registration_number,
      is_manually_controlled,
      auction_schedules!left(
        id,
        status,
        start_time,
        end_time,
        is_manually_controlled
      )
    `)
    .eq("status", "available")
    .gt("reserve_price", 0);
};
