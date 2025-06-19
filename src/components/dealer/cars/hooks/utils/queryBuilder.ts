
import type { Database } from "@/integrations/supabase/types";
import { EnhancedSupabaseClient } from "@/utils/enhancedSupabaseClient";

export const buildLiveAuctionSchedulesQuery = (supabaseClient: EnhancedSupabaseClient) => {
  console.log("Building live auction schedules query with authenticated enhanced client");
  
  // First step: Get all running auction schedules
  return supabaseClient
    .from("auction_schedules")
    .select(`
      car_id,
      status,
      start_time,
      end_time,
      is_manually_controlled
    `)
    // Only show running auction schedules
    .eq("status", "running")
    // Only show schedules where auction is currently running (between start and end time)
    .lte("start_time", new Date().toISOString())
    .gte("end_time", new Date().toISOString());
};

export const buildCarsForSchedulesQuery = (supabaseClient: EnhancedSupabaseClient, carIds: string[]) => {
  console.log("Building cars query for schedules with authenticated enhanced client:", carIds.length, "car IDs");
  
  if (carIds.length === 0) {
    // Return empty query if no car IDs
    return supabaseClient
      .from("cars")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible ID to return empty result
  }
  
  // Second step: Get cars that match the running auction schedules
  return supabaseClient
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
      is_manually_controlled
    `)
    // Only show cars that are auctions with active status
    .eq("is_auction", true)
    .eq("auction_status", "active")
    // Only show cars that match the running auction schedules
    .in("id", carIds)
    // Ensure we have valid reserve prices
    .gt("reserve_price", 0);
};

// Legacy function kept for backward compatibility but now uses two-step approach
export const buildCarListingsQuery = (supabaseClient: EnhancedSupabaseClient) => {
  console.log("Building car listings query (legacy - redirecting to two-step approach)");
  
  // This function is kept for backward compatibility but will be handled
  // by the two-step approach in useCarListingsQuery
  return supabaseClient
    .from("cars")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000"); // Return empty to force two-step approach
};
