
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { buildLiveAuctionSchedulesQuery, buildCarsForSchedulesQuery } from "./utils/queryBuilder";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination, calculatePaginationInfo } from "./utils/paginationUtils";
import { createEnhancedSupabaseClient } from "@/utils/enhancedSupabaseClient";
import { rawSupabaseClient } from "@/integrations/supabase/client";

interface UseCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  dealerId?: string;
}

// Type definition for the debug_auth_context RPC response
interface AuthDebugData {
  auth_uid: string | null;
  has_auth: boolean;
  dealer_exists?: boolean;
  dealer_id?: string;
  dealership_name?: string;
  is_verified?: boolean;
  verification_status?: string;
  error?: string;
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
      "authDebugging",
      "directAuthTest"
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== AUTHENTICATION DEBUG TEST START ===');
      }
      
      try {
        // STEP 0: Test authentication context directly with RPC
        if (isDev) {
          console.log('=== TESTING AUTH CONTEXT WITH RPC ===');
          const { data: authDebugRawData, error: authDebugError } = await rawSupabaseClient.rpc('debug_auth_context');
          
          // Type assertion for the RPC response
          const authDebugData = authDebugRawData as AuthDebugData;
          
          console.log('Auth debug RPC result:', {
            data: authDebugData,
            error: authDebugError?.message,
            hasError: !!authDebugError
          });
          
          if (authDebugError) {
            console.error('Auth debug RPC failed:', authDebugError);
            throw new Error(`Auth debug failed: ${authDebugError.message}`);
          }
          
          if (!authDebugData?.has_auth) {
            console.error('No authentication context found at database level');
            throw new Error('Authentication context not available in database');
          }
          
          if (!authDebugData?.dealer_exists) {
            console.error('Dealer record not found for authenticated user');
            throw new Error('Dealer record not found');
          }
          
          console.log('✅ Authentication verified at database level:', {
            userId: authDebugData.auth_uid,
            dealerId: authDebugData.dealer_id,
            dealershipName: authDebugData.dealership_name,
            isVerified: authDebugData.is_verified,
            verificationStatus: authDebugData.verification_status
          });
        }
        
        // STEP 1: Test direct raw client query to auction_schedules
        if (isDev) {
          console.log('=== TESTING DIRECT RAW CLIENT QUERY ===');
        }
        
        // Use RAW client directly instead of enhanced client for this test
        const directScheduleQuery = rawSupabaseClient
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
        
        const scheduleResult = await directScheduleQuery;
        
        if (scheduleResult.error) {
          console.error("=== DIRECT RAW CLIENT QUERY ERROR ===");
          console.error("Error details:", scheduleResult.error);
          
          // Test if this is specifically an RLS issue by checking auth context again
          if (scheduleResult.error.message.includes('permission denied')) {
            const { data: authRecheckRaw } = await rawSupabaseClient.rpc('debug_auth_context');
            const authRecheck = authRecheckRaw as AuthDebugData;
            console.error("Auth context during permission error:", authRecheck);
          }
          
          throw new Error(scheduleResult.error.message);
        }
        
        const schedules = scheduleResult.data || [];
        if (isDev) {
          console.log('✅ Direct raw client query succeeded. Schedules found:', schedules.length);
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
        const carIds = schedules
          .filter((schedule: any) => schedule && typeof schedule === 'object' && schedule.car_id)
          .map((schedule: any) => schedule.car_id);
        
        if (isDev) {
          console.log('Car IDs from schedules:', carIds.length);
        }
        
        // STEP 2: Get cars using raw client as well
        if (isDev) {
          console.log('=== FETCHING CARS WITH RAW CLIENT ===');
        }
        
        if (carIds.length === 0) {
          return {
            cars: [],
            total: 0
          };
        }
        
        // Use raw client for cars query too
        let carsQuery = rawSupabaseClient
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
        // Note: These utility functions work with the raw query builder
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
          console.log('=== MERGING DATA ===');
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
          console.log('=== FINAL DIRECT RAW CLIENT RESULT ===');
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
        console.error("=== DIRECT RAW CLIENT QUERY ERROR ===");
        console.error("Error:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
