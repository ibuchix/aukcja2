
import { useQuery } from "@tanstack/react-query";
import { CarListing } from "@/types/cars";
import { AuctionFilters } from "../../auction/types";
import { enhancedSupabase } from "@/utils/enhancedSupabaseClient";
import { isValidCarListing, processCarListings } from "./carSearchUtils";

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
          .eq("status", "available"); // Fetch all available cars

        if (isDev) {
          console.log('=== DATABASE QUERY SETUP ===');
          console.log('Base query configured for available cars');
        }
        
        // Apply filters
        if (filters.make && typeof filters.make === 'string') {
          query = query.ilike('make', `%${filters.make}%`);
          if (isDev) console.log('Applied make filter:', filters.make);
        }
        
        if (filters.model && typeof filters.model === 'string') {
          query = query.ilike('model', `%${filters.model}%`);
          if (isDev) console.log('Applied model filter:', filters.model);
        }
        
        if (filters.yearMin && typeof filters.yearMin === 'number') {
          query = query.gte('year', filters.yearMin);
          if (isDev) console.log('Applied yearMin filter:', filters.yearMin);
        }
        
        if (filters.yearMax && typeof filters.yearMax === 'number') {
          query = query.lte('year', filters.yearMax);
          if (isDev) console.log('Applied yearMax filter:', filters.yearMax);
        }
        
        if (filters.priceMin && typeof filters.priceMin === 'number') {
          query = query.gte('reserve_price', filters.priceMin);
          if (isDev) console.log('Applied priceMin filter:', filters.priceMin);
        }
        
        if (filters.priceMax && typeof filters.priceMax === 'number') {
          query = query.lte('reserve_price', filters.priceMax);
          if (isDev) console.log('Applied priceMax filter:', filters.priceMax);
        }
        
        if (filters.mileageMin && typeof filters.mileageMin === 'number') {
          query = query.gte('mileage', filters.mileageMin);
          if (isDev) console.log('Applied mileageMin filter:', filters.mileageMin);
        }
        
        if (filters.mileageMax && typeof filters.mileageMax === 'number') {
          query = query.lte('mileage', filters.mileageMax);
          if (isDev) console.log('Applied mileageMax filter:', filters.mileageMax);
        }
        
        // Apply search query
        if (searchQuery) {
          query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
          if (isDev) console.log('Applied search query:', searchQuery);
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

        if (isDev) {
          console.log('Applied sorting:', sortOption);
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
          console.log('Raw result status:', {
            hasData: !!result.data,
            dataLength: result.data?.length || 0,
            hasError: !!result.error,
            errorMessage: result.error?.message || null,
            errorCode: result.error?.code || null,
            errorDetails: result.error?.details || null
          });
          
          if (result.data && result.data.length > 0) {
            console.log('Sample raw car data:', result.data[0]);
            console.log('All cars reserve prices:', result.data.map(car => ({
              id: car.id,
              make: car.make,
              model: car.model,
              reserve_price: car.reserve_price,
              reserve_price_type: typeof car.reserve_price
            })));
          }
        }
        
        if (result.error) {
          console.error("=== DATABASE ERROR ===");
          console.error("Error details:", {
            message: result.error.message,
            code: result.error.code,
            details: result.error.details,
            hint: result.error.hint
          });
          throw new Error(result.error.message);
        }
        
        // Process and filter the results - Apply dealer filter for dashboard
        const rawData = result.data || [];
        
        if (isDev) {
          console.log('=== PROCESSING CARS ===');
          console.log('Raw data before processing:', rawData.length);
        }
        
        const validCars = processCarListings(rawData, true); // true = apply dealer filter
        
        if (isDev) {
          console.log('=== FINAL RESULT ===');
          console.log('Valid cars after processing:', validCars.length);
          console.log('Final car list:', validCars.map(car => ({
            id: car.id,
            make: car.make,
            model: car.model,
            reserve_price: car.reserve_price
          })));
        }
        
        return {
          cars: validCars,
          total: validCars.length
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("=== QUERY ERROR ===");
        console.error("Error details:", {
          message: errorMessage,
          stack: err.stack,
          name: err.name,
          originalError: err
        });
        throw new Error(errorMessage);
      }
    },
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });
};
