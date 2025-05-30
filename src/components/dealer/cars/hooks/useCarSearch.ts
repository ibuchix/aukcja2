
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
    sortOption,
    searchQuery,
    currentPage,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    clearFilters
  } = useCarFilters();

  if (isDev) {
    console.log('=== USE CAR SEARCH HOOK ===');
    console.log('Dealer ID:', dealerId);
    console.log('Current page:', currentPage);
  }

  const { isLoading, error, data, refetch } = useCarListingsQuery({
    filters,
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
    clearFilters: handleClearFilters
  };
};
