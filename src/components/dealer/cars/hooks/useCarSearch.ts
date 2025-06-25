import { useState, useEffect } from "react";
import { CarListing } from "@/types/cars";
import { useToast } from "@/hooks/use-toast";
import { useCarListingsQuery } from "./useCarListingsQuery";
import { useCarFilters } from "./useCarFilters";
import { calculatePagination } from "./carSearchUtils";

export const useCarSearch = (dealerId: string) => {
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const pageSize = 10;
  const isDev = process.env.NODE_ENV === 'development';

  const {
    filters,
    debouncedFilters, // Use debounced filters for API calls
    sortOption,
    searchQuery,
    currentPage,
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    clearFilters,
    cleanup
  } = useCarFilters();

  if (isDev) {
    console.log('=== USE CAR SEARCH HOOK ===');
    console.log('Dealer ID:', dealerId);
    console.log('Current page:', currentPage);
    console.log('Current filters (UI):', filters);
    console.log('Debounced filters (API):', debouncedFilters);
  }

  // Use debounced filters for the API call
  const { isLoading, error, data, refetch } = useCarListingsQuery({
    filters: debouncedFilters, // Use debounced filters instead of immediate filters
    sortOption,
    searchQuery,
    currentPage,
    pageSize
  });

  if (isDev) {
    console.log('=== QUERY RESULT STATUS ===');
    console.log('Is loading:', isLoading);
    console.log('Has error:', !!error);
    console.log('Has data:', !!data);
    console.log('Data cars count:', data?.cars?.length || 0);
  }

  useEffect(() => {
    if (data?.cars && Array.isArray(data.cars)) {
      const carsFromDb = data.cars;
      
      if (isDev) {
        console.log('=== SETTING LISTINGS ===');
        console.log('Cars from database:', carsFromDb.length);
      }
      
      setListings(carsFromDb);
      
      if (carsFromDb.length === 0 && !isLoading && !error) {
        toast({
          title: "No matching vehicles found",
          description: "Try adjusting your filters to see more results",
          variant: "default"
        });
      }
    } else if (!isLoading && !error) {
      setListings([]);
    }
  }, [data, isLoading, error, toast, isDev]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleClearFilters = () => {
    clearFilters();
    
    toast({
      title: "Filters cleared",
      description: "Showing all available vehicles",
      variant: "default"
    });
  };

  const { canGoNext, canGoBack } = calculatePagination(currentPage, pageSize, data?.total);

  if (isDev) {
    console.log('=== FINAL HOOK RETURN ===');
    console.log('Listings count:', listings.length);
    console.log('Is loading:', isLoading);
    console.log('Error:', error ? (error as Error).message : null);
  }

  return {
    listings,
    isLoading,
    error: error ? (error as Error).message : null,
    
    // Return current filters for UI display
    filters,
    sortOption,
    searchQuery,
    currentPage,
    canGoNext,
    
    // Return individual filter change handler
    handleFilterChange,
    
    // Keep existing handlers for compatibility
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters: handleClearFilters
  };
};
