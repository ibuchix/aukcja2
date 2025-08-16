
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
    handleFilterChange,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
  } = useCarFilters();

  const { data, isLoading, error, refetch } = useSimplifiedCarListingsQuery({
    filters: debouncedFilters,
    sortOption,
    searchQuery,
    currentPage: 1,
    pageSize: 50,
    dealerId: dealerProfile?.id,
  });

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

  const cars = data?.cars || [];

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
    <div className="space-y-6">
      {isMobile ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-body-text">Aukcja</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatuses}
                className="flex items-center gap-1 bg-secondary border-accent/20 text-body-text hover:bg-accent/20 px-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">Status</span>
              </Button>
              <RefreshListingsButton onRefresh={refetch} isLoading={isLoading} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-body-text">Aukcja na żywo</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatuses}
              className="flex items-center gap-2 bg-secondary border-accent/20 text-body-text hover:bg-accent/20"
            >
              <RotateCcw className="h-4 w-4" />
              Aktualizuj statusy
            </Button>
            <RefreshListingsButton onRefresh={refetch} isLoading={isLoading} />
          </div>
        </div>
      )}

      <CarSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        searchQuery={searchQuery}
      />

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
      )}

      {selectedCar && (
        <LiveAuctionDetailsDialog
          car={selectedCar}
          dealerId={dealerProfile?.id || ""}
          isVerified={isVerified}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </div>
  );
};
