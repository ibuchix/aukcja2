
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

  const { isLoading, error, data, refetch } = useCarListingsQuery({
    filters,
    sortOption,
    searchQuery,
    currentPage,
    pageSize
  });

  useEffect(() => {
    if (data?.cars && Array.isArray(data.cars)) {
      const carsFromDb = data.cars;
      
      setListings(carsFromDb);
      
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('Setting listings with preserved data:', {
          count: carsFromDb.length,
          carsWithReservePrice: carsFromDb.filter(car => car.reserve_price !== null && car.reserve_price !== undefined).length,
          carsWithImages: carsFromDb.filter(car => 
            (car.required_photos && Object.keys(car.required_photos).length > 0) ||
            (car.images && car.images.length > 0)
          ).length
        });
      }
      
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
  }, [data, isLoading, error, toast]);

  const handleClearFilters = () => {
    clearFilters();
    
    toast({
      title: "Filters cleared",
      description: "Showing all available vehicles",
      variant: "default"
    });
  };

  const { canGoNext, canGoBack } = calculatePagination(currentPage, pageSize, data?.total);

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
