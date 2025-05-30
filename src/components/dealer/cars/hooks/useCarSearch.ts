
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
    console.log('Current filters:', filters);
    console.log('Current sort:', sortOption);
    console.log('Current search:', searchQuery);
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
    console.log('Error message:', error?.message);
    console.log('Has data:', !!data);
    console.log('Data cars count:', data?.cars?.length || 0);
  }

  useEffect(() => {
    if (isDev) {
      console.log('=== USE EFFECT TRIGGERED ===');
      console.log('Data changed:', {
        hasData: !!data,
        carsArray: !!data?.cars,
        isArray: Array.isArray(data?.cars),
        carsCount: data?.cars?.length || 0,
        isLoading,
        hasError: !!error
      });
    }

    if (data?.cars && Array.isArray(data.cars)) {
      const carsFromDb = data.cars;
      
      if (isDev) {
        console.log('=== SETTING LISTINGS ===');
        console.log('Cars from database:', carsFromDb.length);
        console.log('Cars detail:', carsFromDb.map(car => ({
          id: car.id,
          make: car.make,
          model: car.model,
          reserve_price: car.reserve_price,
          title: car.title
        })));
      }
      
      setListings(carsFromDb);
      
      if (isDev) {
        console.log('=== LISTINGS SET SUCCESSFULLY ===');
        console.log('New listings count:', carsFromDb.length);
      }
      
      if (carsFromDb.length === 0 && !isLoading && !error) {
        if (isDev) {
          console.log('=== SHOWING NO RESULTS TOAST ===');
        }
        toast({
          title: "No matching vehicles found",
          description: "Try adjusting your filters to see more results",
          variant: "default"
        });
      }
    } else if (!isLoading && !error) {
      if (isDev) {
        console.log('=== NO DATA AVAILABLE ===');
        console.log('Setting empty listings');
      }
      setListings([]);
    }
  }, [data, isLoading, error, toast, isDev]);

  const handleClearFilters = () => {
    if (isDev) {
      console.log('=== CLEARING FILTERS ===');
    }
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
