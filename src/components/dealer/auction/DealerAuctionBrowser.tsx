import { useState, useEffect } from "react";
import { AuctionTable } from "./AuctionTable";
import { DealerAuctionFilters } from "./DealerAuctionFilters";
import { AuctionPagination } from "./AuctionPagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuctionBrowser } from "./hooks/useAuctionBrowser";
import { AuctionEmptyState } from "./components/AuctionEmptyState";
import { AuctionFilters, DealerAuctionBrowserProps } from "./types";

export const DealerAuctionBrowser = ({ dealerId }: DealerAuctionBrowserProps) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("ending-soon");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortOption]);

  const { 
    auctions, 
    totalPages, 
    isLoading, 
    error 
  } = useAuctionBrowser(
    dealerId,
    filters,
    sortOption,
    searchQuery,
    currentPage
  );

  const handleFiltersChange = (newFilters: AuctionFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Auctions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading auctions: {(error as Error).message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Auctions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DealerAuctionFilters
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          sortOption={sortOption}
          searchQuery={searchQuery}
        />
        
        <AuctionTable 
          auctions={auctions} 
          isLoading={isLoading} 
          dealerId={dealerId} 
        />
        
        {totalPages > 1 && (
          <AuctionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {auctions.length === 0 && !isLoading && (
          <AuctionEmptyState 
            hasFilters={Object.keys(filters).length > 0}
            hasSearch={!!searchQuery}
          />
        )}
      </CardContent>
    </Card>
  );
};
