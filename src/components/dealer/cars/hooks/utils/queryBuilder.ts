
import { rawSupabaseClient } from "@/integrations/supabase/client";

export const buildCarListingsQuery = () => {
  console.log("Building car listings query for live auctions only");
  
  // Build query to only show cars that are currently in live auction
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
      auction_schedules!inner(
        id,
        status,
        start_time,
        end_time,
        is_manually_controlled
      )
    `)
    // Only show cars that are auctions with active status
    .eq("is_auction", true)
    .eq("auction_status", "active")
    // Only show cars with running auction schedules (not "active")
    .eq("auction_schedules.status", "running")
    // Only show cars where auction is currently running (between start and end time)
    .lte("auction_schedules.start_time", new Date().toISOString())
    .gte("auction_schedules.end_time", new Date().toISOString())
    // Ensure we have valid reserve prices
    .gt("reserve_price", 0);
};
