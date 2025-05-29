import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CarListing } from "@/types/cars";
import { AuctionFilters } from "../../auction/types";
import { useToast } from "@/hooks/use-toast";
import { enhancedSupabase } from "@/utils/enhancedSupabaseClient";

export const useCarSearch = (dealerId: string) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<CarListing[]>([]);
  const pageSize = 10;

  // Improved type guard to ensure we only process valid CarListing objects
  const isValidCarListing = (item: any): item is CarListing => {
    return item && 
           typeof item === 'object' && 
           'id' in item && 
           typeof item.id === 'string' &&
           !('error' in item) &&
           typeof item.price === 'number';
  };

  // Query for car listings using enhanced supabase client
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["carListings", filters, sortOption, searchQuery, currentPage],
    queryFn: async () => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('Car Search Query:', {
          filters,
          sortOption,
          searchQuery,
          currentPage,
          dealerId
        });
      }
      
      try {
        let query = enhancedSupabase
          .from("cars")
          .select(`
            id,
            title,
            price,
            make,
            model,
            year,
            mileage,
            images,
            description,
            features,
            transmission,
            service_history_files,
            required_photos,
            is_auction,
            auction_end_time,
            auction_start_time,
            reserve_price,
            minimum_bid_increment,
            auction_status,
            is_damaged,
            address,
            condition_rating,
            distance,
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
            last_saved
          `)
          .eq("status", "available");
        
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
          query = query.gte('price', filters.priceMin);
        }
        
        if (filters.priceMax && typeof filters.priceMax === 'number') {
          query = query.lte('price', filters.priceMax);
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
            query = query.order('price', { ascending: false });
            break;
          case "price-low":
            query = query.order('price', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }
        
        // Apply pagination
        const fromIndex = (currentPage - 1) * pageSize;
        const to = fromIndex + pageSize - 1;
        query = query.range(fromIndex, to);
        
        const result = await query;
        
        if (isDev) {
          console.log('Car Search Raw Results:', {
            dataLength: result.data?.length || 0,
            hasError: !!result.error,
            errorMessage: result.error?.message || null,
            sampleData: result.data?.[0] || null
          });
        }
        
        if (result.error) {
          console.error("Enhanced Supabase query error:", result.error);
          throw new Error(result.error.message);
        }
        
        // Process and filter the results to ensure only valid CarListing objects
        const rawData = result.data || [];
        const validCars = rawData.filter(isValidCarListing);
        
        if (isDev) {
          console.log('Processed Cars Result:', {
            rawCount: rawData.length,
            validCount: validCars.length,
            sampleCar: validCars[0] || null,
            reservePriceCheck: validCars.map(car => ({ 
              id: car.id, 
              make: car.make, 
              model: car.model, 
              reserve_price: car.reserve_price 
            }))
          });
        }
        
        return {
          cars: validCars,
          total: validCars.length
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error occurred';
        console.error("Error fetching cars:", errorMessage, err);
        throw new Error(errorMessage);
      }
    },
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30000),
  });

  useEffect(() => {
    if (data?.cars && Array.isArray(data.cars)) {
      // Additional filtering to ensure type safety
      const validListings = data.cars.filter(isValidCarListing);
      
      setListings(validListings);
      
      // Show a toast notification if there are no results
      if (validListings.length === 0 && !isLoading && !error) {
        toast({
          title: "No matching vehicles found",
          description: "Try adjusting your filters to see more results",
          variant: "default"
        });
      }
    } else if (!isLoading && !error) {
      // Clear listings if no data and no error
      setListings([]);
    }
  }, [data, isLoading, error, toast]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: AuctionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle sort changes
  const handleSortChange = (sort: string) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  // Handle search changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setCurrentPage(1);
    
    toast({
      title: "Filters cleared",
      description: "Showing all available vehicles",
      variant: "default"
    });
  };

  // Pagination controls
  const canGoNext = data?.total ? currentPage * pageSize < data.total : false;
  
  const handleNextPage = () => {
    if (canGoNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    listings,
    isLoading,
    error: error ? (error as Error).message : null,
    filters,
    sortOption,
    searchQuery,
    currentPage,
    canGoNext,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters
  };
};
