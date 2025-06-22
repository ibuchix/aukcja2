
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination } from "./utils/paginationUtils";
import { supabase } from "@/integrations/supabase/client";

interface UseSimplifiedCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  dealerId?: string;
}

interface LiveAuctionSchedule {
  car_id: string;
  status: string;
  start_time: string;
  end_time: string;
  is_manually_controlled: boolean;
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
        // STEP 1: Get live auction schedules with proper error handling
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('auction_schedules')
          .select(`
            car_id,
            status,
            start_time,
            end_time,
            is_manually_controlled
          `)
          .eq('status', 'running')
          .lte('start_time', new Date().toISOString())
          .gte('end_time', new Date().toISOString());
        
        if (schedulesError) {
          throw new Error(`Live schedules query failed: ${schedulesError.message}`);
        }
        
        // Properly handle the response - check if it's actually data or an error
        let schedules: LiveAuctionSchedule[] = [];
        
        if (schedulesData && Array.isArray(schedulesData)) {
          // Filter out any invalid entries and ensure proper typing
          schedules = schedulesData.filter((item): item is LiveAuctionSchedule => {
            return item && 
                   typeof item === 'object' && 
                   typeof item.car_id === 'string' &&
                   typeof item.status === 'string' &&
                   typeof item.start_time === 'string' &&
                   typeof item.end_time === 'string' &&
                   typeof item.is_manually_controlled === 'boolean';
          });
        }
        
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
        if (carIds.length === 0) {
          return {
            cars: [],
            total: 0
          };
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
        
        if (isDev) {
          console.log('Cars query succeeded. Raw data count:', carsData?.length || 0);
        }
        
        // STEP 3: Merge car data with schedule data
        const rawCars = Array.isArray(carsData) ? carsData : [];
        
        // Type the schedules data properly for merging
        const typedSchedules: AuctionScheduleData[] = schedules.map((schedule: LiveAuctionSchedule) => ({
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
