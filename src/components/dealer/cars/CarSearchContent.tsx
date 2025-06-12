
import React, { useEffect } from "react";
import { CarSearchInfoPanel } from "./info/CarSearchInfoPanel";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { NoResultsFound } from "./status/NoResultsFound";
import { useCarSearch } from "./hooks/useCarSearch";
import { CarSearchFilters } from "./filters/CarSearchFilters";
import { AuctionPagination } from "../auction/AuctionPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useAuthReadiness } from "@/utils/authAwareQuery";

interface CarSearchContentProps {
  dealerId: string;
}

export const CarSearchContent = ({ dealerId }: CarSearchContentProps) => {
  const { canMakeAuthenticatedQueries } = useAuthReadiness();
  
  const {
    listings,
    isLoading,
    error,
    filters,
    sortOption,
    searchQuery,
    canGoNext,
    currentPage,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters
  } = useCarSearch(dealerId);

  const isDev = process.env.NODE_ENV === 'development';
  
  // Log dealer ID and auth readiness for debugging
  useEffect(() => {
    if (isDev) {
      console.log("CarSearch component mounted with dealer ID:", dealerId);
      console.log("Auth readiness:", { canMakeAuthenticatedQueries });
      console.log("Current search state:", {
        listings: listings.length,
        isLoading,
        hasError: !!error,
        errorMessage: error
      });
    }
  }, [dealerId, listings.length, isLoading, error, isDev, canMakeAuthenticatedQueries]);

  return (
    <div className="space-y-6 pb-20">
      <CarSearchInfoPanel />

      {/* Always show search filters */}
      <CarSearchFilters
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />

      <div className="flex justify-between items-center">
        <RefreshListingsButton onRefresh={refetch} />
        
        {isDev && (
          <div className="text-xs text-muted-foreground">
            Dealer ID: {dealerId || "Not available"} | Results: {listings.length} | Auth Ready: {canMakeAuthenticatedQueries ? "Yes" : "No"}
          </div>
        )}
      </div>

      {/* Debugging Info in Development */}
      {isDev && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Car Search Debug: Dealer ID: {dealerId || "None"} | 
            Active filters: {Object.keys(filters).length} | 
            Results: {listings.length} | 
            Loading: {isLoading ? "Yes" : "No"} |
            Error: {error ? "Yes" : "No"} |
            Auth Ready: {canMakeAuthenticatedQueries ? "Yes" : "No"}
          </AlertDescription>
        </Alert>
      )}

      {/* Auth not ready warning */}
      {!canMakeAuthenticatedQueries && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication is still loading. Please wait for the search to become available.
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Profile Warning */}
      {!dealerId && (
        <CarSearchErrorDisplay 
          onRefresh={() => window.location.reload()}
          errorMessage="Your dealer profile needs to be completed before you can search for cars. Please complete your profile setup."
        />
      )}

      {error ? (
        <CarSearchErrorDisplay 
          onRefresh={refetch}
          errorMessage={error}
        />
      ) : (
        <>
          {listings.length === 0 && !isLoading ? (
            <NoResultsFound 
              searchQuery={searchQuery} 
              onClearFilters={clearFilters} 
            />
          ) : (
            <CarListingsGrid 
              listings={listings} 
              isLoading={isLoading} 
            />
          )}

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
