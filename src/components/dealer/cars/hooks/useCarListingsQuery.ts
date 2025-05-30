
import { useQuery } from "@tanstack/react-query";
import { CarListing } from "@/types/cars";
import { AuctionFilters } from "../../auction/types";
import { enhancedSupabase } from "@/utils/enhancedSupabaseClient";
import { processCarListings } from "./carSearchUtils";

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
  return useQuery({
    queryKey: ["carListings", filters, sortOption, searchQuery, currentPage],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== CAR SEARCH QUERY START ===');
        console.log('Query params:', {
          filters,
          sortOption,
          searchQuery,
          currentPage
        });
      }
      
      try {
        // Build query with essential fields only
        let query = enhancedSupabase
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
          .eq("status", "available")
          .gt("reserve_price", 0); // Filter for cars with reserve_price > 0 at database level

        if (isDev) {
          console.log('=== DATABASE QUERY SETUP ===');
          console.log('Base query configured for available cars with reserve_price > 0');
        }
        
        // Apply filters
        if (filters.make && typeof filters.make === 'string') {
          query = query.ilike('make', `%${filters.make}%`);
        }
        
        if (filters.model && typeof filters.model === 'string') {
          query = query.ilike('model', `%${filters.model}%`);
        }
        
        if (filters.yearMin && typeof filters.yearMin === 'number') {
          query = query.gte('year', filters.yearMin);
        }
        
        if (filters.yearMax && typeof filters.yearMax === 'number') {
          query = query.lte('year', filters.yearMax);
        }
        
        if (filters.priceMin && typeof filters.priceMin === 'number') {
          query = query.gte('reserve_price', filters.priceMin);
        }
        
        if (filters.priceMax && typeof filters.priceMax === 'number') {
          query = query.lte('reserve_price', filters.priceMax);
        }
        
        if (filters.mileageMin && typeof filters.mileageMin === 'number') {
          query = query.gte('mileage', filters.mileageMin);
        }
        
        if (filters.mileageMax && typeof filters.mileageMax === 'number') {
          query = query.lte('mileage', filters.mileageMax);
        }
        
        // Apply search query
        if (searchQuery) {
          query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
        }
        
        // Apply sorting
        switch (sortOption) {
          case "newest":
            query = query.order('created_at', { ascending: false });
            break;
          case "oldest":
            query = query.order('created_at', { ascending: true });
            break;
          case "price-high":
            query = query.order('reserve_price', { ascending: false });
            break;
          case "price-low":
            query = query.order('reserve_price', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }
        
        // Apply pagination
        const fromIndex = (currentPage - 1) * pageSize;
        const to = fromIndex + pageSize - 1;
        query = query.range(fromIndex, to);

        if (isDev) {
          console.log('Applied pagination:', { fromIndex, to, currentPage, pageSize });
        }
        
        const result = await query;
        
        if (isDev) {
          console.log('=== DATABASE QUERY RESULT ===');
          console.log('Query successful. Raw data count:', result.data?.length || 0);
          
          if (result.data && result.data.length > 0) {
            console.log('First raw car from DB:', result.data[0]);
          }
        }
        
        if (result.error) {
          console.error("=== DATABASE ERROR ===");
          console.error("Error details:", result.error);
          throw new Error(result.error.message);
        }
        
        // Process the results with transformation
        const rawData = result.data || [];
        const validCars = processCarListings(rawData, false); // Apply transformation and validation
        
        if (isDev) {
          console.log('=== FINAL RESULT ===');
          console.log('Valid cars after processing:', validCars.length);
          if (validCars.length > 0) {
            console.log('First processed car:', validCars[0]);
          }
        }
        
        return {
          cars: validCars,
          total: validCars.length
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("=== QUERY ERROR ===");
        console.error("Error:", errorMessage);
        throw new Error(errorMessage);
      }
    },
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
