
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { buildLiveAuctionSchedulesQuery, buildCarsForSchedulesQuery } from "./utils/queryBuilder";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination, calculatePaginationInfo } from "./utils/paginationUtils";

interface UseCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  dealerId?: string;
}

export const useCarListingsQuery = ({
  filters,
  sortOption,
  searchQuery,
  currentPage,
  pageSize,
  dealerId
}: UseCarListingsQueryProps) => {
  return useEnhancedAuthAwareQuery({
    queryKey: [
      "carListings", 
      JSON.stringify(filters), 
      sortOption, 
      searchQuery, 
      currentPage.toString(),
      "liveAuctionsOnly",
      "twoStepApproach" // Add cache key to differentiate from old approach
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== TWO-STEP LIVE AUCTION CARS QUERY START ===');
        console.log('Query params:', {
          filters,
          sortOption,
          searchQuery,
          currentPage,
          dealerId
        });
      }
      
      try {
        // STEP 1: Get running auction schedules
        if (isDev) {
          console.log('=== STEP 1: FETCHING AUCTION SCHEDULES ===');
        }
        
        const scheduleQuery = buildLiveAuctionSchedulesQuery();
        const scheduleResult = await scheduleQuery;
        
        if (scheduleResult.error) {
          console.error("=== AUCTION SCHEDULES QUERY ERROR ===");
          console.error("Error details:", scheduleResult.error);
          throw new Error(scheduleResult.error.message);
        }
        
        const schedules = scheduleResult.data || [];
        if (isDev) {
          console.log('Auction schedules found:', schedules.length);
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
        
        // Extract car IDs from schedules - fix the TypeScript error
        const carIds = schedules
          .filter((schedule: any) => schedule && typeof schedule === 'object' && schedule.car_id)
          .map((schedule: any) => schedule.car_id);
        
        if (isDev) {
          console.log('Car IDs from schedules:', carIds.length);
        }
        
        // STEP 2: Get cars that match the running schedules
        if (isDev) {
          console.log('=== STEP 2: FETCHING CARS FOR SCHEDULES ===');
        }
        
        let carsQuery = buildCarsForSchedulesQuery(carIds);
        
        // Apply filters, sorting, and pagination to the cars query
        carsQuery = applyFilters(carsQuery, filters, searchQuery);
        carsQuery = applySorting(carsQuery, sortOption);
        carsQuery = applyPagination(carsQuery, currentPage, pageSize);

        if (isDev) {
          const { fromIndex, to } = calculatePaginationInfo(currentPage, pageSize);
          console.log('Applied pagination:', { fromIndex, to, currentPage, pageSize });
        }
        
        const carsResult = await carsQuery;
        
        if (isDev) {
          console.log('=== CARS QUERY RESULT ===');
          console.log('Query successful. Raw data count:', carsResult.data?.length || 0);
        }
        
        if (carsResult.error) {
          console.error("=== CARS DATABASE ERROR ===");
          console.error("Error details:", carsResult.error);
          throw new Error(carsResult.error.message);
        }
        
        // STEP 3: Merge car data with schedule data
        if (isDev) {
          console.log('=== STEP 3: MERGING DATA ===');
        }
        
        const rawCars = carsResult.data || [];
        
        // Properly type the schedules data for merging
        const typedSchedules: AuctionScheduleData[] = schedules
          .filter((schedule: any) => schedule && typeof schedule === 'object')
          .map((schedule: any) => ({
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
          console.log('=== FINAL TWO-STEP RESULT ===');
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
        console.error("=== TWO-STEP LIVE AUCTION QUERY ERROR ===");
        console.error("Error:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
