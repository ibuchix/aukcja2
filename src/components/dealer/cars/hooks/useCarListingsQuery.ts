
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
        // First, let's check what cars exist in the database without any filters
        if (isDev) {
          const { data: allCars, error: allCarsError } = await enhancedSupabase
            .from("cars")
            .select("id, title, make, model, status, reserve_price")
            .limit(5);
            
          console.log('=== ALL CARS IN DATABASE (first 5) ===');
          console.log('All cars query error:', allCarsError);
          console.log('All cars found:', allCars?.length || 0);
          if (allCars && allCars.length > 0) {
            console.log('Sample cars:', allCars.map(car => ({
              id: car.id,
              title: car.title,
              make: car.make,
              model: car.model,
              status: car.status,
              reserve_price: car.reserve_price
            })));
          }
        }

        // Now let's try with just the status filter
        if (isDev) {
          const { data: availableCars, error: availableError } = await enhancedSupabase
            .from("cars")
            .select("id, title, make, model, status, reserve_price")
            .eq("status", "available")
            .limit(5);
            
          console.log('=== CARS WITH STATUS = "available" ===');
          console.log('Available cars query error:', availableError);
          console.log('Available cars found:', availableCars?.length || 0);
          if (availableCars && availableCars.length > 0) {
            console.log('Available cars:', availableCars);
          }
        }

        // Now let's try with both filters
        if (isDev) {
          const { data: filteredCars, error: filteredError } = await enhancedSupabase
            .from("cars")
            .select("id, title, make, model, status, reserve_price")
            .eq("status", "available")
            .gt("reserve_price", 0)
            .limit(5);
            
          console.log('=== CARS WITH STATUS = "available" AND RESERVE_PRICE > 0 ===');
          console.log('Filtered cars query error:', filteredError);
          console.log('Filtered cars found:', filteredCars?.length || 0);
          if (filteredCars && filteredCars.length > 0) {
            console.log('Filtered cars:', filteredCars);
          }
        }

        let query = enhancedSupabase
          .from("cars")
          .select(`
            id,
            title,
            reserve_price,
            make,
            model,
            year,
            mileage,
            images,
            features,
            transmission,
            required_photos,
            additional_photos,
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
          console.log('Query successful. Cars found:', result.data?.length || 0);
          
          if (result.data && result.data.length > 0) {
            console.log('Cars with reserve prices:', result.data.map(car => ({
              id: car.id,
              make: car.make,
              model: car.model,
              reserve_price: car.reserve_price
            })));
          }
        }
        
        if (result.error) {
          console.error("=== DATABASE ERROR ===");
          console.error("Error details:", result.error);
          throw new Error(result.error.message);
        }
        
        // Process the results - no dealer filter needed since it's handled at DB level
        const rawData = result.data || [];
        const validCars = processCarListings(rawData, false); // false = no additional dealer filtering
        
        if (isDev) {
          console.log('=== FINAL RESULT ===');
          console.log('Valid cars after processing:', validCars.length);
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
