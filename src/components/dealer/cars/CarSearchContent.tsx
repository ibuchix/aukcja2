
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { DealerAuctionFilters } from "../auction/DealerAuctionFilters";
import { AuctionPagination } from "../auction/AuctionPagination";
import { CarSearchInfoPanel } from "./info/CarSearchInfoPanel";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { useCarSearch } from "./hooks/useCarSearch";

interface CarSearchContentProps {
  dealerId: string;
}

export const CarSearchContent = ({ dealerId }: CarSearchContentProps) => {
  const {
    listings,
    isLoading,
    error,
    sortOption,
    searchQuery,
    canGoNext,
    currentPage,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch
  } = useCarSearch(dealerId);

  return (
    <div className="space-y-6">
      <CarSearchInfoPanel />

      <DealerAuctionFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />

      <RefreshListingsButton onRefresh={refetch} />

      {error ? (
        <CarSearchErrorDisplay />
      ) : (
        <>
          <CarListingsGrid 
            listings={listings} 
            isLoading={isLoading} 
          />

          <AuctionPagination
            hasMore={canGoNext}
            canGoBack={currentPage > 1}
            onNext={handleNextPage}
            onPrevious={handlePreviousPage}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};
