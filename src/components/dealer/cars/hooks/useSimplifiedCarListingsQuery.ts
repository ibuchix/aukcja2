
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { fetchLiveAuctionSchedules } from "./utils/liveAuctionSchedulesQuery";
import { fetchCarsForSchedules } from "./utils/carsQueryBuilder";

interface UseSimplifiedCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  dealerId?: string;
}

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
      "v5"
    ],
    queryFn: async () => {
      
      // TEMPORARY: Always log query start to debug Toyota issue
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
        
        // If no running schedules, return empty result
        if (schedules.length === 0) {
          console.log('❌ [NO SCHEDULES] [ALWAYS SHOWN] - No running auction schedules found');
          return {
            cars: [],
            total: 0
          };
        }
        
        // Extract car IDs from schedules
        const carIds = schedules.map((schedule) => schedule.car_id);
        
        console.log('🔢 [CAR IDS FROM SCHEDULES] [ALWAYS SHOWN]', {
          carIdsCount: carIds.length,
          carIds: carIds.slice(0, 5) // Show first 5 for debugging
        });
        
        // STEP 2: Get cars for these schedules
        const rawCars = await fetchCarsForSchedules(
          carIds,
          filters,
          sortOption,
          searchQuery,
          currentPage,
          pageSize
        );
        
        // TEMPORARY: Check if rawCars is valid data before accessing properties
        if (Array.isArray(rawCars)) {
          console.log('🚗 [RAW CARS RESULT] [ALWAYS SHOWN]', {
            rawCarsCount: rawCars.length,
            appliedFilters: filters,
            rawCarsPreview: rawCars.slice(0, 2).map(car => ({
              id: car.id,
              make: car.make,
              model: car.model,
              title: car.title
            }))
          });
        } else {
          console.log('❌ [RAW CARS ERROR] [ALWAYS SHOWN]', {
            error: 'rawCars is not an array',
            rawCars
          });
          return {
            cars: [],
            total: 0
          };
        }
        
        // STEP 3: Merge car data with schedule data
        const typedSchedules: AuctionScheduleData[] = schedules.map((schedule) => ({
          car_id: schedule.car_id,
          status: schedule.status,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_manually_controlled: schedule.is_manually_controlled
        }));
        
        const mergedData = mergeCarDataWithSchedules(rawCars, typedSchedules);
        
        // Process the merged results
        const validCars = processCarData(mergedData);
        
        console.log('✅ [FINAL RESULT] [ALWAYS SHOWN]', {
          validCarsCount: validCars.length,
          finalCarsPreview: validCars.slice(0, 2).map(car => ({
            id: car.id,
            make: car.make,
            model: car.model,
            title: car.title,
            auctionTimingStatus: car.auctionTimingStatus
          }))
        });
        
        return {
          cars: validCars,
          total: validCars.length
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
