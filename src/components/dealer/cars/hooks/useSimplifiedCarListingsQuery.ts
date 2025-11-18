
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { fetchLiveAuctionSchedules } from "./utils/liveAuctionSchedulesQuery";
import { fetchCarsForSchedules } from "./utils/carsQueryBuilder";
import { fetchCarFileUploads, type CarFileUpload } from "@/utils/imageUtils/carFileUploads";

interface UseSimplifiedCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  dealerId?: string;
}

// Enhanced type guard for car objects with comprehensive validation
const isValidCarObject = (car: any): car is Record<string, any> => {
  // Basic validation
  if (!car || typeof car !== 'object' || car === null) {
    console.log('❌ [CAR VALIDATION] Invalid car object:', typeof car);
    return false;
  }
  
  // Check if it's an error object
  if ('error' in car || 'message' in car) {
    console.log('❌ [CAR VALIDATION] Error object detected:', car);
    return false;
  }
  
  // Must have an ID field
  if (!('id' in car) || typeof car.id !== 'string') {
    console.log('❌ [CAR VALIDATION] Missing or invalid ID:', car.id);
    return false;
  }
  
  console.log('✅ [CAR VALIDATION] Valid car object:', {
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

export const useSimplifiedCarListingsQuery = ({
  filters,
  sortOption,
  searchQuery,
  currentPage,
  pageSize,
  dealerId
}: UseSimplifiedCarListingsQueryProps) => {
  return useEnhancedAuthAwareQuery({
    queryKey: [
      "simplifiedCarListings", 
      JSON.stringify(filters), 
      sortOption, 
      searchQuery, 
      currentPage.toString(),
      pageSize.toString(),
      "v9" // Increment version to force refetch after RLS fix
    ],
    queryFn: async () => {
      
      // TEMPORARY: Always log query start to debug pricing issue
      console.log('🚀 [SIMPLIFIED CAR LISTINGS QUERY START] [ALWAYS SHOWN]', {
        timestamp: new Date().toISOString(),
        filters,
        sortOption,
        searchQuery,
        currentPage,
        pageSize,
        dealerId
      });
      
      try {
        // STEP 1: Get live auction schedules using RPC function
        const schedules = await fetchLiveAuctionSchedules();
        
        // TEMPORARY: Always log schedules result
        console.log('📋 [SCHEDULES RESULT] [ALWAYS SHOWN]', {
          schedulesCount: schedules.length,
          schedules: schedules.slice(0, 3) // Show first 3 for debugging
        });
        
        // If no active schedules, return empty result
        if (schedules.length === 0) {
          console.log('❌ [NO SCHEDULES] [ALWAYS SHOWN] - No active auction schedules found');
          return {
            cars: [],
            total: 0
          };
        }
        
        // Extract car IDs from schedules
        const scheduleCarIds = schedules.map((schedule) => schedule.car_id);
        
        console.log('🔢 [CAR IDS FROM SCHEDULES] [ALWAYS SHOWN]', {
          carIdsCount: scheduleCarIds.length,
          carIds: scheduleCarIds.slice(0, 5) // Show first 5 for debugging
        });
        
        // STEP 2: Get cars for these schedules
        // STEP 2: Get cars for these schedules
        const rawCarsResult = await fetchCarsForSchedules(
          scheduleCarIds,
          filters,
          sortOption,
          searchQuery,
          currentPage,
          pageSize
        );
        
        // Handle both old array format and new { cars, total } format
        let rawCars: any[];
        let totalCount: number;
        
        if (rawCarsResult && typeof rawCarsResult === 'object' && 'cars' in rawCarsResult) {
          // New format: { cars: [], total: number }
          rawCars = rawCarsResult.cars || [];
          totalCount = rawCarsResult.total || 0;
        } else if (Array.isArray(rawCarsResult)) {
          // Old format: just array (fallback)
          rawCars = rawCarsResult;
          totalCount = rawCarsResult.length;
        } else {
          rawCars = [];
          totalCount = 0;
        }
        
        console.log('📊 [RAW CARS RESULT] [ALWAYS SHOWN]', {
          carsInCurrentPage: rawCars.length,
          totalMatchingCars: totalCount,
          currentPage,
          pageSize
        });
        
        // Enhanced validation with better error handling
        if (!Array.isArray(rawCars)) {
          console.log('❌ [RAW CARS ERROR] [ALWAYS SHOWN]', {
            error: 'rawCars is not an array',
            rawCarsType: typeof rawCars,
            rawCars: rawCars
          });
          return {
            cars: [],
            total: 0
          };
        }

        if (rawCars.length === 0) {
          console.log('⚠️ [RAW CARS EMPTY] [ALWAYS SHOWN] - No cars returned from query');
          return {
            cars: [],
            total: totalCount // Return true total even if this page is empty
          };
        }

        // Filter to only valid car objects before processing
        const validRawCars = rawCars.filter(isValidCarObject);
        
        // Safe logging for valid cars with proper type handling
        const validCarsPreview = validRawCars
          .slice(0, 2)
          .map(car => ({
            id: safeGetProperty(car, 'id'),
            make: safeGetProperty(car, 'make'),
            model: safeGetProperty(car, 'model'),
            title: safeGetProperty(car, 'title', 'No title'),
            reserve_price: safeGetProperty(car, 'reserve_price', 0),
            price: safeGetProperty(car, 'price', 0)
          }));
        
        console.log('🚗 [RAW CARS VALIDATION] [ALWAYS SHOWN]', {
          rawCarsCount: rawCars.length,
          validCarsCount: validRawCars.length,
          invalidCarsCount: rawCars.length - validRawCars.length,
          appliedFilters: filters,
          validCarsPreview
        });
        
        // STEP 3: Merge car data with schedule data
        const typedSchedules: AuctionScheduleData[] = schedules.map((schedule) => ({
          car_id: schedule.car_id,
          status: schedule.status,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_manually_controlled: schedule.is_manually_controlled
        }));
        
        const mergedData = mergeCarDataWithSchedules(validRawCars, typedSchedules);
        
        // Process the merged results
        const validCars = processCarData(mergedData);
        
        // STEP 4: Ensure authentication before fetching file uploads
        console.log('🔐 [AUTH CHECK] [ALWAYS SHOWN] Checking authentication before fetching file uploads');
        
        // Deduplicate car IDs to avoid unnecessary requests
        const carIds = Array.from(new Set(validCars.map(car => car.id).filter(Boolean)));
        console.log('🖼️ [FETCHING FILE UPLOADS] [ALWAYS SHOWN] Starting to fetch file uploads for', validCars.length, 'cars with', carIds.length, 'unique IDs');
        
        // Check if Tonale ID is in the request
        const tonaleId = 'c255a006-eb33-47e3-ba4e-5f024e41b57e';
        if (carIds.includes(tonaleId)) {
          console.log('🎯 [TONALE IN REQUEST] Alfa Romeo Tonale ID is included in fetch request');
        }
        
        const carFileUploads = await fetchCarFileUploads(carIds);
        
        console.log('📸 [FILE UPLOADS RESULT] [ALWAYS SHOWN]', {
          totalUploads: carFileUploads.length,
          carIdsRequested: carIds.length,
          uploadsByCar: carFileUploads.reduce((acc, upload) => {
            acc[upload.car_id] = (acc[upload.car_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
        
        // Organize uploads by car_id
        const uploadsByCarId = carFileUploads.reduce((acc, upload) => {
          if (!acc[upload.car_id]) {
            acc[upload.car_id] = [];
          }
          acc[upload.car_id].push(upload);
          return acc;
        }, {} as Record<string, CarFileUpload[]>);
        
        // Attach file uploads to each car
        const carsWithUploads = validCars.map(car => {
          const fileUploads = uploadsByCarId[car.id] || [];
          
          // Special logging for Tonale
          if (car.id === tonaleId) {
            console.log('🎯 [TONALE MAPPING]', {
              carId: car.id,
              title: car.title,
              uploadsInMap: uploadsByCarId[car.id]?.length || 0,
              uploadsAttached: fileUploads.length,
              hasUploadsInMap: car.id in uploadsByCarId
            });
          }
          
          console.log('🖼️ [CAR FILE UPLOADS] [ALWAYS SHOWN]', {
            carId: car.id,
            make: car.make,
            model: car.model,
            uploadsFound: fileUploads.length,
            uploads: fileUploads.map(u => ({ category: u.category, file_path: u.file_path }))
          });
          
          return {
            ...car,
            fileUploads: fileUploads
          };
        });
        
        console.log('✅ [FINAL RESULT] [ALWAYS SHOWN]', {
          carsInCurrentPage: carsWithUploads.length,
          totalMatchingCars: totalCount,
          currentPage,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          finalCarsPreview: carsWithUploads.slice(0, 2).map(car => ({
            id: car.id,
            make: car.make,
            model: car.model,
            title: car.title,
            reserve_price: car.reservePrice,
            auctionTimingStatus: car.auctionTimingStatus,
            fileUploadsCount: car.fileUploads?.length || 0
          }))
        });
        
        return {
          cars: carsWithUploads,
          total: totalCount // Use true total from count query
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("❌ [SIMPLIFIED QUERY ERROR] [ALWAYS SHOWN]", {
          timestamp: new Date().toISOString(),
          error: errorMessage,
          filters,
          stack: err.stack
        });
        
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 1,
    retryDelay: attempt => 2000,
  });
};
