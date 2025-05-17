import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processCarData } from "@/utils/carDataHelpers";
import { CarListing } from "@/types/cars";
import { AuctionFilters } from "../../auction/types";
import { useToast } from "@/hooks/use-toast";

export const useCarSearch = (dealerId: string) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<CarListing[]>([]);
  const pageSize = 10;

  // Query for car listings
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["carListings", filters, sortOption, searchQuery, currentPage],
    queryFn: async () => {
      // Log the query parameters for debugging
      console.log('Car Search Query:', {
        filters,
        sortOption,
        searchQuery,
        currentPage,
        dealerId
      });
      
      let query = supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .eq("is_draft", false);
      
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
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      // Log the results for debugging
      console.log('Car Search Results:', {
        count: data?.length || 0,
        totalCount: count || 0,
        error: error?.message || null
      });
      
      if (error) throw error;
      
      return {
        cars: processCarData(data || []),
        total: count || 0
      };
    },
  });

  useEffect(() => {
    if (data?.cars) {
      setListings(data.cars);
      
      // Show a toast notification if there are no results
      if (data.cars.length === 0 && !isLoading) {
        toast({
          title: "No matching vehicles found",
          description: "Try adjusting your filters to see more results",
          variant: "default"
        });
      }
    }
  }, [data, isLoading, toast]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: AuctionFilters) => {
    console.log('Filter changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle sort changes
  const handleSortChange = (sort: string) => {
    console.log('Sort changed:', sort);
    setSortOption(sort);
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Handle search changes
  const handleSearchChange = (search: string) => {
    console.log('Search changed:', search);
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page on search change
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    // Keep the sort option as is
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
    error,
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
