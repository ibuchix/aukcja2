
import { useEnhancedAuthAwareQuery } from "@/utils/enhancedAuthAwareQuery";
import { AuctionFilters } from "../../auction/types";
import { processCarData } from "@/utils/carDataHelpers";
import { buildCarListingsQuery } from "./utils/queryBuilder";
import { applyFilters } from "./utils/filterUtils";
import { applySorting } from "./utils/sortUtils";
import { applyPagination, calculatePaginationInfo } from "./utils/paginationUtils";

interface UseCarListingsQueryProps {
  filters: AuctionFilters;
  sortOption: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
}

export const useCarListingsQuery = ({
  filters,
  sortOption,
  searchQuery,
  currentPage,
  pageSize
}: UseCarListingsQueryProps) => {
  return useEnhancedAuthAwareQuery({
    queryKey: [
      "carListings", 
      JSON.stringify(filters), 
      sortOption, 
      searchQuery, 
      currentPage.toString()
    ],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== DEALER CAR SEARCH QUERY START ===');
        console.log('Query params:', {
          filters,
          sortOption,
          searchQuery,
          currentPage
        });
      }
      
      try {
        // Build base query with auction schedule data for authenticated dealers
        let query = buildCarListingsQuery();

        if (isDev) {
          console.log('=== DEALER DATABASE QUERY SETUP ===');
          console.log('Base query configured for dealers with auction schedule data');
        }
        
        // Apply filters and search
        query = applyFilters(query, filters, searchQuery);
        
        // Apply sorting
        query = applySorting(query, sortOption);
        
        // Apply pagination
        query = applyPagination(query, currentPage, pageSize);

        if (isDev) {
          const { fromIndex, to } = calculatePaginationInfo(currentPage, pageSize);
          console.log('Applied pagination:', { fromIndex, to, currentPage, pageSize });
        }
        
        const result = await query;
        
        if (isDev) {
          console.log('=== DEALER DATABASE QUERY RESULT ===');
          console.log('Query successful. Raw data count:', result.data?.length || 0);
          
          if (result.data && result.data.length > 0) {
            console.log('First raw car from DB with schedule (dealer view):', result.data[0]);
          }
        }
        
        if (result.error) {
          console.error("=== DEALER DATABASE ERROR ===");
          console.error("Error details:", result.error);
          throw new Error(result.error.message);
        }
        
        // Process the results with transformation including schedule data for dealers
        const rawData = result.data || [];
        const validCars = processCarData(rawData);
        
        if (isDev) {
          console.log('=== DEALER FINAL RESULT ===');
          console.log('Valid cars after processing:', validCars.length);
          if (validCars.length > 0) {
            console.log('First processed car with timing status (dealer view):', {
              id: validCars[0].id,
              make: validCars[0].make,
              model: validCars[0].model,
              auctionTimingStatus: validCars[0].auctionTimingStatus,
              scheduleStartTime: validCars[0].scheduleStartTime,
              scheduleEndTime: validCars[0].scheduleEndTime
            });
          }
        }
        
        return {
          cars: validCars,
          total: validCars.length
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("=== DEALER QUERY ERROR ===");
        console.error("Error:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    requireAuth: true, // This query requires authentication
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
