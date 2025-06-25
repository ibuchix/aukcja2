
import { useState, useCallback, useRef } from "react";
import { AuctionFilters } from "../../auction/types";

export const useCarFilters = () => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const [debouncedFilters, setDebouncedFilters] = useState<AuctionFilters>({});

  // Debounced filter update function
  const updateDebouncedFilters = useCallback((newFilters: AuctionFilters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(newFilters);
    }, 500);
  }, []);

  // Handle individual filter changes
  const handleFilterChange = useCallback((key: keyof AuctionFilters, value: string | undefined) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (value === '' || value === null || value === undefined) {
        delete newFilters[key];
      } else {
        (newFilters as any)[key] = value;
      }
      
      // Update debounced filters
      updateDebouncedFilters(newFilters);
      
      return newFilters;
    });
    setCurrentPage(1);
  }, [updateDebouncedFilters]);

  // Handle complete filter object changes
  const handleFiltersChange = useCallback((newFilters: AuctionFilters) => {
    setFilters(newFilters);
    updateDebouncedFilters(newFilters);
    setCurrentPage(1);
  }, [updateDebouncedFilters]);

  // Handle sort changes
  const handleSortChange = useCallback((sort: string) => {
    setSortOption(sort);
    setCurrentPage(1);
  }, []);

  // Handle search changes
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    setDebouncedFilters(emptyFilters);
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  // Pagination controls
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    // Current filter states (for UI display)
    filters,
    debouncedFilters, // For API calls
    sortOption,
    searchQuery,
    currentPage,
    
    // Individual filter change handlers
    handleFilterChange,
    
    // Batch change handlers
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    
    // Pagination
    handleNextPage,
    handlePreviousPage,
    
    // Utilities
    clearFilters,
    cleanup
  };
};
