
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
      "v4"
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== SIMPLIFIED CAR LISTINGS QUERY START ===');
      }
      
      try {
        // STEP 1: Get live auction schedules
        const schedules = await fetchLiveAuctionSchedules();
        
        if (isDev) {
          console.log('✅ Direct schedules query succeeded. Schedules found:', schedules.length);
        }
        
        // If no running schedules, return empty result
        if (schedules.length === 0) {
          if (isDev) {
            console.log('No running auction schedules found, returning empty result');
          }
          return {
            cars: [],
            total: 0
          };
        }
        
        // Extract car IDs from schedules
        const carIds = schedules.map((schedule) => schedule.car_id);
        
        if (isDev) {
          console.log('Car IDs from schedules:', carIds.length);
        }
        
        // STEP 2: Get cars for these schedules
        const rawCars = await fetchCarsForSchedules(
          carIds,
          filters,
          sortOption,
          searchQuery,
          currentPage,
          pageSize
        );
        
        if (isDev) {
          console.log('Cars query succeeded. Raw data count:', rawCars.length);
        }
        
        // STEP 3: Merge car data with schedule data
        // Type the schedules data properly for merging
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
        
        if (isDev) {
          console.log('=== SIMPLIFIED FINAL RESULT ===');
          console.log('Valid live auction cars:', validCars.length);
          if (validCars.length > 0) {
            console.log('First processed live auction car:', {
              id: validCars[0].id,
              make: validCars[0].make,
              model: validCars[0].model,
              auctionTimingStatus: validCars[0].auctionTimingStatus,
              scheduleStartTime: validCars[0].scheduleStartTime,
              scheduleEndTime: validCars[0].scheduleEndTime,
              scheduleStatus: validCars[0].scheduleStatus
            });
          }
        }
        
        return {
          cars: validCars,
          total: validCars.length
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("=== SIMPLIFIED QUERY ERROR ===");
        console.error("Error:", errorMessage);
        
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 1,
    retryDelay: attempt => 2000,
  });
};
