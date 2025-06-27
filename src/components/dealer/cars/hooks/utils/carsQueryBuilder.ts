
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "../../../auction/types";
import { applyFilters } from "./filterUtils";
import { applySorting } from "./sortUtils";
import { applyPagination } from "./paginationUtils";

// Enhanced type guard for car objects with proper validation and debugging
const isValidCarObject = (car: any): car is Record<string, any> => {
  if (!car || typeof car !== 'object' || car === null) {
    console.log('❌ [CAR BUILDER VALIDATION] Invalid car object:', typeof car);
    return false;
  }
  
  // Check if it's an error object
  if ('error' in car || 'message' in car) {
    console.log('❌ [CAR BUILDER VALIDATION] Error object detected:', car);
    return false;
  }
  
  // Must have an ID field
  if (!('id' in car) || typeof car.id !== 'string') {
    console.log('❌ [CAR BUILDER VALIDATION] Missing or invalid ID:', car.id);
    return false;
  }
  
  console.log('✅ [CAR BUILDER VALIDATION] Valid car object:', {
    id: car.id,
    make: car.make,
    model: car.model,
    reserve_price: car.reserve_price
  });
  
  return true;
};

// Safe property access helper
const safeGetProperty = (obj: any, prop: string, defaultValue: any = 'Unknown') => {
  if (obj && typeof obj === 'object' && prop in obj) {
    return obj[prop] || defaultValue;
  }
  return defaultValue;
};

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

  // Enhanced validation and debugging
  if (!Array.isArray(data)) {
    console.log('❌ [CARS QUERY DATA ERROR] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      error: 'Data is not an array',
      dataType: typeof data,
      data: data
    });
    return [];
  }

  if (data.length === 0) {
    console.log('⚠️ [CARS QUERY EMPTY] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      message: 'Query returned empty array',
      filters,
      carIdsCount: carIds.length
    });
    return [];
  }

  // Filter out invalid entries and log detailed info
  const validCarsForSample = data.filter(isValidCarObject);
  
  // Safe sample results mapping
  const sampleResults = validCarsForSample
    .slice(0, 2)
    .map(car => ({
      id: safeGetProperty(car, 'id'),
      make: safeGetProperty(car, 'make'),
      model: safeGetProperty(car, 'model'),
      title: safeGetProperty(car, 'title', 'No title'),
      reserve_price: safeGetProperty(car, 'reserve_price', 0),
      price: safeGetProperty(car, 'price', 0)
    }));
  
  console.log('✅ [CARS QUERY SUCCESS] [ALWAYS SHOWN]', {
    timestamp: new Date().toISOString(),
    resultCount: data.length,
    validCarsCount: validCarsForSample.length,
    invalidCarsCount: data.length - validCarsForSample.length,
    filters,
    sampleResults
  });

  return data || [];
};
