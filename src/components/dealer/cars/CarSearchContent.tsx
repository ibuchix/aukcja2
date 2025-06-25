
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
import { AlertCircle, Info, Shield } from "lucide-react";
import { useAuthReadiness } from "@/utils/authAwareQuery";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";

interface CarSearchContentProps {
  dealerId: string;
}

export const CarSearchContent = ({ dealerId }: CarSearchContentProps) => {
  const { canMakeAuthenticatedQueries } = useAuthReadiness();
  const { dealerProfile, isLoading: profileLoading } = useDealerProfileSimple();
  
  const {
    listings,
    isLoading,
    error,
    filters,
    sortOption,
    searchQuery,
    canGoNext,
    currentPage,
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters
  } = useCarSearch(dealerId);

  const isDev = process.env.NODE_ENV === 'development';
  const isVerified = dealerProfile?.is_verified;
  
  // Log dealer verification status for debugging
  useEffect(() => {
    if (isDev) {
      console.log("CarSearch component status:", {
        dealerId,
        isVerified,
        canMakeAuthenticatedQueries,
        listings: listings.length,
        isLoading,
        hasError: !!error
      });
    }
  }, [dealerId, isVerified, listings.length, isLoading, error, isDev, canMakeAuthenticatedQueries]);

  // Show verification warning if dealer is not verified
  if (!profileLoading && !isVerified) {
    return (
      <div className="space-y-6 pb-20">
        <CarSearchInfoPanel />
        
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Verification Required:</strong> Only verified dealers can view live auctions and place bids. 
            Please complete your dealer verification to access the auction marketplace.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <CarSearchInfoPanel />

      {/* Always show search filters for verified dealers */}
      <CarSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
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
            Dealer ID: {dealerId || "Not available"} | Live Auctions: {listings.length} | Verified: {isVerified ? "Yes" : "No"}
          </div>
        )}
      </div>

      {/* Debugging Info in Development */}
      {isDev && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Live Auction Search Debug: Dealer ID: {dealerId || "None"} | 
            Verified: {isVerified ? "Yes" : "No"} | 
            Active filters: {Object.keys(filters).length} | 
            Live auctions: {listings.length} | 
            Loading: {isLoading ? "Yes" : "No"} |
            Error: {error ? "Yes" : "No"}
          </AlertDescription>
        </Alert>
      )}

      {/* Auth not ready warning */}
      {!canMakeAuthenticatedQueries && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication is still loading. Please wait for the live auction search to become available.
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Profile Warning */}
      {!dealerId && (
        <CarSearchErrorDisplay 
          onRefresh={() => window.location.reload()}
          errorMessage="Your dealer profile needs to be completed before you can view live auctions. Please complete your profile setup."
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
            <NoLiveAuctionsFound 
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

// New component for no live auctions state
const NoLiveAuctionsFound = ({ 
  searchQuery, 
  onClearFilters 
}: { 
  searchQuery: string; 
  onClearFilters: () => void; 
}) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <Shield className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Live Auctions Found
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {searchQuery 
          ? `No live auctions match your search for "${searchQuery}". Try adjusting your search terms or filters.`
          : "There are currently no live auctions available. Check back later for new auctions."
        }
      </p>
      {searchQuery && (
        <button
          onClick={onClearFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear search and filters
        </button>
      )}
    </div>
  );
};
