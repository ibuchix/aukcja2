
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { DealerAuctionFilters } from "../auction/DealerAuctionFilters";
import { AuctionPagination } from "../auction/AuctionPagination";
import { CarSearchInfoPanel } from "./info/CarSearchInfoPanel";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { useCarSearch } from "./hooks/useCarSearch";

interface CarSearchProps {
  dealerId: string;
}

export const CarSearch = ({ dealerId }: CarSearchProps) => {
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-primary" />
          <CardTitle>Car Search</CardTitle>
        </div>
        <CardDescription>
          Find available vehicles and upcoming auctions directly from your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <div className="p-4 text-center text-destructive">
            Error loading car listings. Please try again.
          </div>
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
      </CardContent>
    </Card>
  );
};
