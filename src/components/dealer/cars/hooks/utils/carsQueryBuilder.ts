
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
  // TEMPORARY: Always log the query building process
  console.log('🔧 [BUILDING CARS QUERY] [ALWAYS SHOWN]', {
    timestamp: new Date().toISOString(),
    carIdsCount: carIds.length,
    filters,
    sortOption,
    searchQuery,
    currentPage,
    pageSize
  });

  // Start with base query for cars that are in the provided car IDs
  let query = supabase
    .from('cars')
    .select('*')
    .in('id', carIds)
    .eq('is_auction', true)
    .eq('auction_status', 'active');

  // TEMPORARY: Log query after basic filters
  console.log('🔨 [QUERY AFTER BASIC FILTERS] [ALWAYS SHOWN]', {
    message: 'Applied basic filters: in(id, carIds), is_auction=true, auction_status=active',
    carIdsCount: carIds.length
  });

  // Apply additional filters
  query = applyFilters(query, filters, searchQuery);

  // TEMPORARY: Log after applying filters
  console.log('🎯 [QUERY AFTER CUSTOM FILTERS] [ALWAYS SHOWN]', {
    message: 'Applied custom filters',
    filters,
    searchQuery
  });

  // Apply sorting
  query = applySorting(query, sortOption);

  // TEMPORARY: Log after sorting
  console.log('📊 [QUERY AFTER SORTING] [ALWAYS SHOWN]', {
    message: 'Applied sorting',
    sortOption
  });

  // Apply pagination
  query = applyPagination(query, currentPage, pageSize);

  // TEMPORARY: Log final query
  console.log('📄 [FINAL QUERY] [ALWAYS SHOWN]', {
    message: 'Applied pagination, executing query',
    currentPage,
    pageSize
  });

  // Execute the query
  const { data, error } = await query;

  if (error) {
    console.error('❌ [CARS QUERY ERROR] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      error: error.message,
      filters,
      carIdsCount: carIds.length
    });
    throw error;
  }

  // TEMPORARY: Check if data is valid before accessing properties
  if (Array.isArray(data) && data.length > 0) {
    console.log('✅ [CARS QUERY SUCCESS] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      resultCount: data.length,
      filters,
      sampleResults: data.slice(0, 2).map(car => {
        // Fixed: Added proper null check for car
        if (car && typeof car === 'object' && 'id' in car) {
          return {
            id: car.id || 'unknown',
            make: car.make || 'Unknown',
            model: car.model || 'Unknown',
            title: car.title || 'No title',
            reserve_price: car.reserve_price || 0
          };
        }
        return { id: 'unknown', make: 'Error', model: 'Error', title: 'Error', reserve_price: 0 };
      })
    });
  } else {
    console.log('❌ [CARS QUERY DATA ERROR] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      error: 'Data is not a valid array or is empty',
      dataType: typeof data,
      dataLength: Array.isArray(data) ? data.length : 'not array'
    });
  }

  return data || [];
};
