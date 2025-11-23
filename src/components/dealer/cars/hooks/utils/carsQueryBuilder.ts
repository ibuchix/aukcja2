
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "../../../auction/types";
import { applyFilters } from "./filterUtils";
import { applySorting } from "./sortUtils";
import { applyPagination } from "./paginationUtils";
import { fetchCarFileUploads, type CarFileUpload } from "@/utils/imageUtils/carFileUploads";

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

  // Apply database sorting only when NOT using default schedule order
  if (sortOption !== 'newest') {
    query = applySorting(query, sortOption);
    console.log('🔄 [DATABASE SORTING APPLIED] [ALWAYS SHOWN]', {
      message: 'Applied user-selected database sorting',
      sortOption,
      totalCarIds: carIds.length
    });
  } else {
    console.log('📊 [PRESERVING SCHEDULE ORDER] [ALWAYS SHOWN]', {
      message: 'Using default schedule creation order (client-side sort below)',
      sortOption,
      firstCarId: carIds[0],
      totalCarIds: carIds.length
    });
  }

  // Get total count BEFORE pagination (critical for dynamic pagination)
  const countQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .in('id', carIds)
    .eq('is_auction', true)
    .eq('auction_status', 'active');

  // Apply same filters to count query
  const filteredCountQuery = applyFilters(countQuery, filters, searchQuery);
  const { count: totalCount, error: countError } = await filteredCountQuery;

  if (countError) {
    console.error('❌ [COUNT ERROR] [ALWAYS SHOWN]', countError);
  }

  console.log('📊 [TOTAL COUNT] [ALWAYS SHOWN]', {
    totalMatchingCars: totalCount,
    currentPage,
    pageSize,
    totalPages: totalCount ? Math.ceil(totalCount / pageSize) : 0
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
  const { data: queryData, error } = await query;

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
  if (!Array.isArray(queryData)) {
    console.log('❌ [CARS QUERY DATA ERROR] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      error: 'Data is not an array',
      dataType: typeof queryData,
      data: queryData
    });
    return [];
  }

  if (queryData.length === 0) {
    console.log('⚠️ [CARS QUERY EMPTY] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      message: 'Query returned empty array',
      filters,
      carIdsCount: carIds.length
    });
    return [];
  }

  // Only apply schedule order when sortOption is "newest" (default)
  if (sortOption === 'newest') {
    // Sort cars to match the order of carIds array (preserves schedule creation order)
    const carIdOrderMap = new Map<string, number>();
    carIds.forEach((id, index) => {
      carIdOrderMap.set(id, index);
    });
    
    queryData.sort((a: any, b: any) => {
      const orderA = carIdOrderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = carIdOrderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    
    console.log('✅ [SCHEDULE ORDER PRESERVED] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      message: 'Showing most recently scheduled first',
      sortOption,
      first3Cars: queryData.slice(0, 3).map((c: any) => ({ 
        id: c.id, 
        make: c.make, 
        model: c.model, 
        year: c.year 
      }))
    });
  } else {
    console.log('✅ [USER SORTING APPLIED] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      message: 'Database sorting respected',
      sortOption,
      first3Cars: queryData.slice(0, 3).map((c: any) => ({ 
        id: c.id, 
        make: c.make, 
        model: c.model, 
        year: c.year 
      }))
    });
  }

  // Fetch car file uploads for all retrieved cars
  let carsWithImages = queryData;
  try {
    const carIdsArray = queryData.map((car: any) => car?.id).filter(Boolean);
    const fileUploads = await fetchCarFileUploads(carIdsArray);
    
    console.log('📸 [CAR FILE UPLOADS] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      carsCount: carIdsArray.length,
      uploadsCount: fileUploads.length,
      message: 'Fetched car file uploads'
    });

    // Organize uploads by car ID
    const uploadsByCarId = fileUploads.reduce((acc, upload) => {
      if (!acc[upload.car_id]) {
        acc[upload.car_id] = [];
      }
      acc[upload.car_id].push(upload);
      return acc;
    }, {} as Record<string, CarFileUpload[]>);

    // Attach file uploads to each car
    carsWithImages = queryData.map((car: any) => ({
      ...car,
      fileUploads: uploadsByCarId[car?.id] || []
    }));
    
    console.log('🚗 [CARS WITH IMAGES] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      carsWithImagesCount: carsWithImages.filter((car: any) => car.fileUploads?.length > 0).length,
      totalCarsCount: carsWithImages.length
    });

  } catch (uploadError) {
    console.error('❌ [CAR FILE UPLOADS ERROR] [ALWAYS SHOWN]', {
      timestamp: new Date().toISOString(),
      error: uploadError,
      message: 'Failed to fetch car file uploads, continuing without images'
    });
    // Continue with cars but without file uploads
  }

  // Filter out invalid entries and log detailed info
  const validCarsForSample = carsWithImages.filter(isValidCarObject);
  
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
    resultCount: carsWithImages.length,
    validCarsCount: validCarsForSample.length,
    invalidCarsCount: carsWithImages.length - validCarsForSample.length,
    totalCount: totalCount || 0,
    filters,
    sampleResults
  });

  return {
    cars: carsWithImages || [],
    total: totalCount || 0
  };
};
