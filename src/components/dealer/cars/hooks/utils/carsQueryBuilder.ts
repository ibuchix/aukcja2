
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "../../../auction/types";
import { applyFilters } from "./filterUtils";
import { applySorting } from "./sortUtils";
import { applyPagination } from "./paginationUtils";

export const fetchCarsForSchedules = async (
  carIds: string[],
  filters: AuctionFilters,
  sortOption: string,
  searchQuery: string,
  currentPage: number,
  pageSize: number
) => {
  if (carIds.length === 0) {
    return [];
  }
  
  let carsQuery = supabase
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
  
  // Apply filters, sorting, and pagination
  carsQuery = applyFilters(carsQuery, filters, searchQuery);
  carsQuery = applySorting(carsQuery, sortOption);
  carsQuery = applyPagination(carsQuery, currentPage, pageSize);
  
  const { data: carsData, error: carsError } = await carsQuery;
  
  if (carsError) {
    throw new Error(`Cars query failed: ${carsError.message}`);
  }
  
  return Array.isArray(carsData) ? carsData : [];
};
