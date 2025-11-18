import { useState } from "react";
import { useSimplifiedCarListingsQuery } from "./hooks/useSimplifiedCarListingsQuery";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { LiveAuctionCard } from "./LiveAuctionCard";
import { LiveAuctionDetailsDialog } from "./LiveAuctionDetailsDialog";
import { CarSearchFilters } from "./filters/CarSearchFilters";
import { useCarFilters } from "./hooks/useCarFilters";
import { AuctionEmptyState } from "../auction/components/AuctionEmptyState";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { useAuctionStatusMonitor } from "@/hooks/useAuctionStatusMonitor";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuctionPagination } from "./AuctionPagination";
import { useScrollPrefetch } from "@/hooks/useScrollPrefetch";
import { CompactPaginationInfo } from "./CompactPaginationInfo";

export const SimpleLiveAuctionsView = () => {
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const { dealerProfile } = useDealerProfileSimple();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const {
    filters,
    debouncedFilters,
    sortOption,
    searchQuery,
    currentPage,
    handleNextPage,
    handlePreviousPage,
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
  } = useCarFilters();

  const { data, isLoading, error, refetch } = useSimplifiedCarListingsQuery({
    filters: debouncedFilters,
    sortOption,
    searchQuery,
    currentPage,
    pageSize: 100,
    dealerId: dealerProfile?.id,
  });

  const cars = data?.cars || [];
  const total = data?.total || 0;
  
  // Prefetch images as user scrolls through results
  useScrollPrefetch({
    items: cars,
    lookahead: 8,
    threshold: 0.7
  });
  
  // Dynamic pagination calculations
  const totalPages = Math.ceil(total / 100);
  const hasMore = currentPage < totalPages;
  const canGoBack = currentPage > 1;

  const handleCloseCarDetails = () => {
    setSelectedCar(null);
  };

  // Monitor auction status changes and refresh data when needed
  const { triggerStatusUpdate } = useAuctionStatusMonitor({
    onAuctionEnded: (carId, finalStatus) => {
      console.log(`Auction ended for car ${carId} with status ${finalStatus}`);
      // Invalidate and refetch the listings
      queryClient.invalidateQueries({ queryKey: ["simplifiedCarListings"] });
    },
    onAuctionStarted: (carId) => {
      console.log(`Auction started for car ${carId}`);
      // Invalidate and refetch the listings
      queryClient.invalidateQueries({ queryKey: ["simplifiedCarListings"] });
    },
  });

  const handleRefreshStatuses = async () => {
    await triggerStatusUpdate();
    refetch();
  };

  // Check if dealer is verified
  const isVerified = dealerProfile?.verification_status === 'approved' || dealerProfile?.is_verified === true;

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Błąd ładowania aukcji: {error.message}</p>
        <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-center'}`}>
        <div>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-2`}>
            Aukcje na żywo
          </h2>
          <p className={`text-gray-300 ${isMobile ? 'text-sm' : ''}`}>
            Sprawdź dostępne pojazdy i złóż swoją ofertę
          </p>
        </div>
        <RefreshListingsButton onRefresh={refetch} isLoading={isLoading} />
      </div>

      <CarSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />

      {!isLoading && cars.length > 0 && (
        <CompactPaginationInfo
          currentPage={currentPage}
          pageSize={100}
          total={total}
        />
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-accent/20 aspect-video rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-accent/20 h-4 rounded"></div>
                <div className="bg-accent/20 h-4 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <AuctionEmptyState 
          hasFilters={Object.keys(filters).length > 0}
          hasSearch={!!searchQuery}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <LiveAuctionCard
                key={car.id}
                car={car}
                dealerId={dealerProfile?.id || ""}
                onClick={setSelectedCar}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Wyświetlanie {((currentPage - 1) * 100) + 1}-{Math.min(currentPage * 100, total)} z {total} pojazdów
              </div>
              
              <AuctionPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  if (page > currentPage) {
                    handleNextPage();
                  } else if (page < currentPage) {
                    handlePreviousPage();
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {selectedCar && (
        <LiveAuctionDetailsDialog
          car={selectedCar}
          dealerId={dealerProfile?.id || ""}
          isVerified={isVerified}
          onClose={handleCloseCarDetails}
        />
      )}
    </div>
  );
};