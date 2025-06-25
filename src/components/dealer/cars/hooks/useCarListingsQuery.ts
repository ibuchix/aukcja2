
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { mergeCarDataWithSchedules, AuctionScheduleData } from "./utils/dataHelpers";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination, calculatePaginationInfo } from "./utils/paginationUtils";
import { supabase } from "@/integrations/supabase/client";
import { SessionDebugger } from "@/utils/sessionDebugger";
import { SessionAwareQueryBuilder } from "@/utils/sessionAwareQuery";

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
      "sessionAware"
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== SESSION-AWARE CAR LISTINGS QUERY START ===');
        console.log('Query params:', {
          filters,
          sortOption,
          searchQuery,
          currentPage,
          pageSize
        });
      }
      
      try {
        // STEP 1: Capture initial session state
        const initialSession = await SessionDebugger.captureSessionState('Car Listings Query Start');
        
        if (!SessionDebugger.hasValidSession(initialSession)) {
          throw new Error(`Invalid session state: ${JSON.stringify(initialSession)}`);
        }
        
        // STEP 2: Test authentication context with session-aware query
        const authTestResult = await SessionAwareQueryBuilder.executeQuery(
          async () => {
            const { data, error } = await supabase.rpc('debug_auth_context');
            return { data: data as unknown as AuthDebugData, error };
          },
          { context: 'Auth Context Test', maxRetries: 2, retryDelay: 1000 }
        );
        
        if (authTestResult.error) {
          throw new Error(`Auth context test failed: ${authTestResult.error.message}`);
        }
        
        const authDebugData = authTestResult.data;
        if (!authDebugData?.auth_uid) {
          throw new Error('No authentication context found despite valid session token');
        }
        
        if (authDebugData?.dealer_exists !== true) {
          throw new Error('Dealer record not found - please complete your profile');
        }
        
        if (isDev) {
          console.log('✅ Session-aware auth test successful:', {
            sessionUserId: initialSession.userId,
            authContextUserId: authDebugData.auth_uid,
            dealerId: authDebugData.dealer_id,
            dealershipName: authDebugData.dealership_name,
            isVerified: authDebugData.is_verified,
            tokensMatch: initialSession.userId === authDebugData.auth_uid,
            dealerExists: authDebugData.dealer_exists
          });
        }
        
        // STEP 3: Get auction schedules with relaxed time constraints for debugging
        const now = new Date();
        const schedulesResult = await SessionAwareQueryBuilder.executeQuery(
          async () => {
            const query = supabase
              .from("auction_schedules")
              .select(`
                car_id,
                status,
                start_time,
                end_time,
                is_manually_controlled
              `)
              .in("status", ["running", "scheduled", "completed"]); // Use valid status values
            
            return query;
          },
          { context: 'Auction Schedules Query', maxRetries: 2, retryDelay: 1000 }
        );
        
        if (schedulesResult.error) {
          if (isDev) {
            console.log('Schedules query failed:', schedulesResult.error.message);
          }
          // Don't throw error, just continue with empty schedules
        }
        
        const schedules = schedulesResult.data || [];
        if (isDev) {
          console.log('✅ Session-aware schedules query completed. Schedules found:', schedules.length);
          if (schedules.length > 0) {
            console.log('First few schedules:', schedules.slice(0, 3));
          }
        }
        
        // STEP 4: Get all active auction cars with relaxed constraints
        const carsResult = await SessionAwareQueryBuilder.executeQuery(
          async () => {
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
                is_manually_controlled,
                fuel_type
              `)
              .eq("is_auction", true)
              .in("auction_status", ["active", "pending"])  // Include more statuses
              .gte("reserve_price", 0); // Allow zero reserve prices too
            
            // Apply filters, sorting, and pagination
            carsQuery = applyFilters(carsQuery, filters, searchQuery);
            carsQuery = applySorting(carsQuery, sortOption);
            carsQuery = applyPagination(carsQuery, currentPage, pageSize);
            
            return carsQuery;
          },
          { context: 'Cars Query', maxRetries: 2, retryDelay: 1000 }
        );
        
        if (carsResult.error) {
          throw new Error(`Cars query failed: ${carsResult.error.message}`);
        }
        
        // Check if carsResult.data is valid before accessing properties
        const rawCars = Array.isArray(carsResult.data) ? carsResult.data : [];
        
        if (isDev) {
          const { fromIndex, to } = calculatePaginationInfo(currentPage, pageSize);
          console.log('Applied pagination:', { fromIndex, to, currentPage, pageSize });
          console.log('Session-aware cars query succeeded. Raw data count:', rawCars.length);
          
          if (rawCars.length > 0) {
            const firstCar = rawCars[0];
            // Type guard to ensure we have valid car data with proper null checking
            if (firstCar && typeof firstCar === 'object' && 'id' in firstCar && firstCar.id) {
              console.log('Sample car data:', {
                id: firstCar.id,
                make: firstCar.make || 'N/A',
                model: firstCar.model || 'N/A',
                year: firstCar.year || 'N/A',
                reserve_price: firstCar.reserve_price || 0,
                auction_status: firstCar.auction_status || 'N/A'
              });
            }
          }
        }
        
        // STEP 5: Merge car data with schedule data (if available)
        
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
          console.log('=== FINAL SESSION-AWARE RESULT ===');
          console.log('Valid cars after processing:', validCars.length);
          if (validCars.length > 0) {
            console.log('First processed car:', {
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
        console.error("=== SESSION-AWARE QUERY ERROR ===");
        console.error("Error:", errorMessage);
        console.error("Stack:", err.stack);
        
        // Capture final session state for debugging
        await SessionDebugger.captureSessionState(`Query Error: ${errorMessage}`);
        
        throw new Error(errorMessage);
      }
    },
    requireAuth: true,
    retry: 1, // Reduced since we handle retries internally
    retryDelay: attempt => 2000, // 2 second delay between retries
  });
};
