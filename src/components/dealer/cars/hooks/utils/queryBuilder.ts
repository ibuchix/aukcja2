
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export const buildLiveAuctionSchedulesQuery = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log("Building live auction schedules query with consistent client");
  }
  
  // Use consistent Supabase client to ensure JWT token forwarding
  return supabase
    .from("auction_schedules")
    .select(`
      car_id,
      status,
      start_time,
      end_time,
      is_manually_controlled
    `)
    .eq("status", "running")
    .lte("start_time", new Date().toISOString())
    .gte("end_time", new Date().toISOString());
};

export const buildCarsForSchedulesQuery = (carIds: string[]) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log("Building cars query for schedules with consistent client:", carIds.length, "car IDs");
  }
  
  if (carIds.length === 0) {
    // Return empty query if no car IDs
    return supabase
      .from("cars")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible ID to return empty result
  }
  
  // Use consistent Supabase client for cars query
  return supabase
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
    .eq("is_auction", true)
    .eq("auction_status", "active")
    .in("id", carIds)
    .gt("reserve_price", 0);
};
