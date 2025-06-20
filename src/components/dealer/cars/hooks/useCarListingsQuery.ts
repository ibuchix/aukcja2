
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination, calculatePaginationInfo } from "./utils/paginationUtils";
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
  dealer_exists?: boolean;
  dealer_id?: string;
  dealership_name?: string;
  is_verified?: boolean;
  verification_status?: string;
  session_exists?: boolean;
  timestamp?: string;
  error?: string;
}

interface SessionTokenInfo {
  hasSession: boolean;
  userId: string | null;
  tokenLength: number;
  tokenPreview: string;
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
      "simplifiedClient",
      "directSupabaseAccess"
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== SIMPLIFIED CLIENT AUTHENTICATION START ===');
      }
      
      try {
        // STEP 1: Verify current session with raw Supabase client
        const { data: sessionData, error: sessionError } = await rawSupabaseClient.auth.getSession();
        
        let sessionInfo: SessionTokenInfo = {
          hasSession: false,
          userId: null,
          tokenLength: 0,
          tokenPreview: 'none'
        };
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!sessionData.session) {
          console.error('No active session found');
          throw new Error('No active session - please sign in again');
        }
        
        if (!sessionData.session.access_token) {
          console.error('No access token in session');
          throw new Error('No access token available - please sign in again');
        }
        
        sessionInfo = {
          hasSession: true,
          userId: sessionData.session.user?.id || null,
          tokenLength: sessionData.session.access_token.length,
          tokenPreview: sessionData.session.access_token.substring(0, 20) + '...'
        };
        
        if (isDev) {
          console.log('✅ Session verification successful:', sessionInfo);
        }
        
        // STEP 2: Test authentication context to ensure JWT is working
        if (isDev) {
          console.log('=== TESTING AUTH CONTEXT WITH DIRECT CLIENT ===');
        }
        
        const { data: authDebugRawData, error: authDebugError } = await rawSupabaseClient.rpc('debug_auth_context');
        const authDebugData = authDebugRawData as unknown as AuthDebugData;
        
        if (isDev) {
          console.log('Auth debug RPC result:', {
            data: authDebugData,
            error: authDebugError?.message,
            hasError: !!authDebugError,
            sessionUserId: sessionInfo.userId,
            authContextUserId: authDebugData?.auth_uid,
          });
        }
        
        if (authDebugError) {
          console.error('Auth debug RPC failed:', authDebugError);
          throw new Error(`Auth debug failed: ${authDebugError.message}`);
        }
        
        if (!authDebugData?.auth_uid) {
          console.error('No authentication context found despite valid session token');
          throw new Error('Authentication context not properly forwarded to database');
        }
        
        if (authDebugData?.dealer_exists !== true) {
          console.error('Dealer record not found for authenticated user:', authDebugData?.auth_uid);
          throw new Error('Dealer record not found - please complete your profile');
        }
        
        if (isDev) {
          console.log('✅ Authentication verified with direct client:', {
            sessionUserId: sessionInfo.userId,
            authContextUserId: authDebugData.auth_uid,
            dealerId: authDebugData.dealer_id,
            dealershipName: authDebugData.dealership_name,
            isVerified: authDebugData.is_verified,
            tokensMatch: sessionInfo.userId === authDebugData.auth_uid,
            dealerExists: authDebugData.dealer_exists
          });
        }
        
        // STEP 3: Use direct Supabase client for database queries
        if (isDev) {
          console.log('=== USING DIRECT SUPABASE CLIENT ===');
        }
        
        // Get auction schedules using direct client (should preserve auth context)
        const schedulesQuery = rawSupabaseClient
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
        
        const scheduleResult = await schedulesQuery;
        
        if (scheduleResult.error) {
          console.error("=== DIRECT CLIENT SCHEDULE QUERY ERROR ===");
          console.error("Error details:", scheduleResult.error);
          throw new Error(`Direct client schedule query failed: ${scheduleResult.error.message}`);
        }
        
        const schedules = scheduleResult.data || [];
        if (isDev) {
          console.log('✅ Direct client schedule query succeeded. Schedules found:', schedules.length);
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
        
        // STEP 4: Get cars using direct client
        if (isDev) {
          console.log('=== FETCHING CARS WITH DIRECT CLIENT ===');
        }
        
        if (carIds.length === 0) {
          return {
            cars: [],
            total: 0
          };
        }
        
        // Use direct client for cars query
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
        carsQuery = applyFilters(carsQuery, filters, searchQuery);
        carsQuery = applySorting(carsQuery, sortOption);
        carsQuery = applyPagination(carsQuery, currentPage, pageSize);

        if (isDev) {
          const { fromIndex, to } = calculatePaginationInfo(currentPage, pageSize);
          console.log('Applied pagination:', { fromIndex, to, currentPage, pageSize });
        }
        
        const carsResult = await carsQuery;
        
        if (isDev) {
          console.log('=== DIRECT CLIENT CARS QUERY RESULT ===');
          console.log('Query successful. Raw data count:', carsResult.data?.length || 0);
        }
        
        if (carsResult.error) {
          console.error("=== DIRECT CLIENT CARS ERROR ===");
          console.error("Error details:", carsResult.error);
          throw new Error(`Direct client cars query failed: ${carsResult.error.message}`);
        }
        
        // STEP 5: Merge car data with schedule data
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
          console.log('=== FINAL SIMPLIFIED CLIENT RESULT ===');
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
        console.error("=== SIMPLIFIED CLIENT QUERY ERROR ===");
        console.error("Error:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
