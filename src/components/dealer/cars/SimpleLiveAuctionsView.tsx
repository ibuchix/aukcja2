
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { CarSearchFilters } from "./filters/CarSearchFilters";
import { CarListingsGrid } from "./listing/CarListingsGrid";
import { AuctionPagination } from "../auction/AuctionPagination";
import { RefreshListingsButton } from "./actions/RefreshListingsButton";
import { useCarSearch } from "./hooks/useCarSearch";

interface DealerProfile {
  id: string;
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

interface SimpleLiveAuctionsViewProps {
  dealerId: string;
  dealerProfile: DealerProfile | null;
  isProfileLoading?: boolean;
}

export const SimpleLiveAuctionsView = ({ 
  dealerId, 
  dealerProfile, 
  isProfileLoading = false 
}: SimpleLiveAuctionsViewProps) => {
  const {
    listings,
    isLoading: auctionsLoading,
    error,
    filters,
    sortOption,
    searchQuery,
    currentPage,
    canGoNext,
    handleFiltersChange,
    handleSortChange,
    handleSearchChange,
    handleNextPage,
    handlePreviousPage,
    refetch,
    clearFilters
  } = useCarSearch(dealerId);

  // Debug logging for profile state tracking
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('=== SimpleLiveAuctionsView Profile State Debug ===');
    console.log('dealerId:', dealerId);
    console.log('dealerProfile received:', {
      exists: !!dealerProfile,
      id: dealerProfile?.id,
      dealership: dealerProfile?.dealership_name,
      isVerified: dealerProfile?.is_verified,
      verificationStatus: dealerProfile?.verification_status
    });
    console.log('isProfileLoading:', isProfileLoading);
    console.log('=== End Profile Debug ===');
  }

  // Show loading state while profile is loading
  if (isProfileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dealer profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show profile not found state
  if (!dealerProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load dealer profile. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show verification required if dealer is not verified
  if (!dealerProfile.is_verified) {
    if (isDev) {
      console.log('Dealer not verified - showing verification message');
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Verification Required</h3>
            <p className="text-muted-foreground">
              Your dealer account needs to be verified to view live auctions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show auctions loading state
  if (auctionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading live auctions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state for auction loading
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load auctions. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isDev) {
    console.log('Rendering auctions for verified dealer:', {
      dealershipName: dealerProfile.dealership_name,
      listingsCount: listings.length,
      isVerified: dealerProfile.is_verified
    });
  }

  // Show no auctions state
  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Auctions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Live Auctions Right Now</h3>
            <p className="text-muted-foreground mb-4">
              There are currently no vehicles in live auction. Check back later for new opportunities.
            </p>
            <p className="text-sm text-muted-foreground">
              New auctions are added regularly throughout the day.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show live auctions with full search functionality
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Live Auctions ({listings.length})
            </CardTitle>
            <RefreshListingsButton onRefresh={refetch} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-6">
            <CarSearchFilters
              onFiltersChange={handleFiltersChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              sortOption={sortOption}
              searchQuery={searchQuery}
            />
          </div>

          {/* Car Listings Grid */}
          <CarListingsGrid 
            listings={listings}
            isLoading={auctionsLoading}
          />

          {/* Pagination */}
          <div className="mt-6">
            <AuctionPagination
              hasMore={canGoNext}
              onNext={handleNextPage}
              onPrevious={handlePreviousPage}
              canGoBack={currentPage > 1}
              isLoading={auctionsLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
