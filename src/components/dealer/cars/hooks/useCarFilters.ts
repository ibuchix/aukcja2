
import { useState } from "react";
import { AuctionFilters } from "../../auction/types";

export const useCarFilters = () => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

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
  };

  // Pagination controls
  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
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
  };
};
