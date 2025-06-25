
import { useState, useEffect, useRef } from "react";
import { AuctionTable } from "./AuctionTable";
import { CarSearchFilters } from "../cars/filters/CarSearchFilters";
import { AuctionPagination } from "./AuctionPagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuctionBrowser } from "./hooks/useAuctionBrowser";
import { AuctionEmptyState } from "./components/AuctionEmptyState";
import { DealerAuctionBrowserProps } from "./types";
import { useCarFilters } from "../cars/hooks/useCarFilters";

export const DealerAuctionBrowser = ({ dealerId }: DealerAuctionBrowserProps) => {
  const {
    filters,
    debouncedFilters,
    sortOption,
    searchQuery,
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    cleanup
  } = useCarFilters();

  const [cursor, setCursor] = useState<string | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const cursorHistoryRef = useRef<string[]>([]);

  // Reset pagination when filters or search change
  useEffect(() => {
    setCursor(null);
    setDirection('next');
    cursorHistoryRef.current = [];
  }, [debouncedFilters, searchQuery, sortOption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const { 
    auctions, 
    hasMore,
    nextCursor,
    prevCursor,
    isLoading, 
    error 
  } = useAuctionBrowser(
    dealerId,
    debouncedFilters, // Use debounced filters for API calls
    sortOption,
    searchQuery,
    cursor,
    direction
  );

  const handleNextPage = () => {
    if (nextCursor) {
      // Save current cursor to history for "back" functionality
      if (cursor) {
        cursorHistoryRef.current.push(cursor);
      }
      setCursor(nextCursor);
      setDirection('next');
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistoryRef.current.length > 0) {
      // Pop the last cursor from history
      const previousCursor = cursorHistoryRef.current.pop();
      setCursor(previousCursor || null);
      setDirection('prev');
    } else if (prevCursor) {
      // If no history but we have a prevCursor
      setCursor(prevCursor);
      setDirection('prev');
    }
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
        <CarSearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
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
        
        <AuctionPagination
          hasMore={hasMore}
          canGoBack={cursor !== null || cursorHistoryRef.current.length > 0}
          onNext={handleNextPage}
          onPrevious={handlePreviousPage}
          isLoading={isLoading}
        />
        
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
