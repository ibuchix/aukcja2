
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

  const isDev = process.env.NODE_ENV === 'development';

  // Enhanced logging utility
  const logFilterAction = useCallback((action: string, data: any) => {
    // TEMPORARY: Always log filter actions to debug Toyota issue
    console.log(`🔍 [FILTER ${action.toUpperCase()}] [ALWAYS SHOWN]`, {
      timestamp: new Date().toISOString(),
      action,
      data,
      currentFilters: filters,
      debouncedFilters,
      activeFilterCount: Object.keys(filters).length
    });
  }, [filters, debouncedFilters]);

  // Debounced filter update function
  const updateDebouncedFilters = useCallback((newFilters: AuctionFilters) => {
    logFilterAction('DEBOUNCE_START', { newFilters });
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      logFilterAction('DEBOUNCE_CLEAR', { previousTimer: 'cleared' });
    }
    
    debounceTimerRef.current = setTimeout(() => {
      logFilterAction('DEBOUNCE_EXECUTE', { newFilters });
      setDebouncedFilters(newFilters);
    }, 300); // Reduced from 500ms for better responsiveness
  }, [logFilterAction]);

  // Handle individual filter changes
  const handleFilterChange = useCallback((key: keyof AuctionFilters, value: string | undefined) => {
    logFilterAction('INDIVIDUAL_CHANGE', { key, value, previousValue: filters[key] });
    
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (value === '' || value === null || value === undefined) {
        delete newFilters[key];
        logFilterAction('FILTER_REMOVED', { key, newFilters });
      } else {
        (newFilters as any)[key] = value;
        logFilterAction('FILTER_ADDED', { key, value, newFilters });
      }
      
      // Update debounced filters
      updateDebouncedFilters(newFilters);
      
      return newFilters;
    });
    setCurrentPage(1);
    logFilterAction('PAGE_RESET', { reason: 'filter_change' });
  }, [updateDebouncedFilters, logFilterAction, filters]);

  // Handle complete filter object changes
  const handleFiltersChange = useCallback((newFilters: AuctionFilters) => {
    logFilterAction('BULK_CHANGE', { 
      newFilters, 
      previousFilters: filters,
      changedKeys: Object.keys(newFilters).filter(key => newFilters[key] !== filters[key])
    });
    
    setFilters(newFilters);
    updateDebouncedFilters(newFilters);
    setCurrentPage(1);
    logFilterAction('PAGE_RESET', { reason: 'bulk_filter_change' });
  }, [updateDebouncedFilters, logFilterAction, filters]);

  // Handle sort changes
  const handleSortChange = useCallback((sort: string) => {
    logFilterAction('SORT_CHANGE', { previousSort: sortOption, newSort: sort });
    setSortOption(sort);
    setCurrentPage(1);
    logFilterAction('PAGE_RESET', { reason: 'sort_change' });
  }, [sortOption, logFilterAction]);

  // Handle search changes
  const handleSearchChange = useCallback((search: string) => {
    logFilterAction('SEARCH_CHANGE', { previousSearch: searchQuery, newSearch: search });
    setSearchQuery(search);
    setCurrentPage(1);
    logFilterAction('PAGE_RESET', { reason: 'search_change' });
  }, [searchQuery, logFilterAction]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    logFilterAction('CLEAR_ALL', { 
      clearedFilters: filters,
      clearedSearch: searchQuery 
    });
    
    setFilters(emptyFilters);
    setDebouncedFilters(emptyFilters);
    setSearchQuery("");
    setCurrentPage(1);
    logFilterAction('CLEAR_COMPLETE', { result: 'all_cleared' });
  }, [filters, searchQuery, logFilterAction]);

  // Pagination controls
  const handleNextPage = useCallback(() => {
    logFilterAction('PAGINATION', { action: 'next', currentPage, newPage: currentPage + 1 });
    setCurrentPage(prev => prev + 1);
  }, [currentPage, logFilterAction]);

  const handlePreviousPage = useCallback(() => {
    const newPage = Math.max(1, currentPage - 1);
    logFilterAction('PAGINATION', { action: 'previous', currentPage, newPage });
    setCurrentPage(newPage);
  }, [currentPage, logFilterAction]);

  // Cleanup function
  const cleanup = useCallback(() => {
    logFilterAction('CLEANUP', { hasTimer: !!debounceTimerRef.current });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [logFilterAction]);

  // TEMPORARY: Always log current state on each render to debug Toyota issue
  console.log('🎯 [FILTER STATE SNAPSHOT] [ALWAYS SHOWN]', {
    timestamp: new Date().toISOString(),
    filters,
    debouncedFilters,
    sortOption,
    searchQuery,
    currentPage,
    activeFilterCount: Object.keys(filters).length,
    hasDebounceTimer: !!debounceTimerRef.current
  });

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
    cleanup,
    
    // Debug utilities
    logFilterAction
  };
};
