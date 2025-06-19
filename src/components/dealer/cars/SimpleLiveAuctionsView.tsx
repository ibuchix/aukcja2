
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { CarListing } from "@/types/cars";
import { CarListingCard } from "./listing/CarListingCard";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { useCarSearch } from "./hooks/useCarSearch";

interface SimpleLiveAuctionsViewProps {
  dealerId: string;
}

export const SimpleLiveAuctionsView = ({ dealerId }: SimpleLiveAuctionsViewProps) => {
  const { dealerProfile, isLoading: profileLoading } = useDealerProfileSimple();
  const { listings, isLoading: auctionsLoading, error } = useCarSearch(dealerId);

  // Show loading state
  if (profileLoading || auctionsLoading) {
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

  // Show error state
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

  // Show verification required
  if (!dealerProfile?.is_verified) {
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

  // Show live auctions
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Live Auctions ({listings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((car) => (
            <CarListingCard 
              key={car.id} 
              car={car} 
              onViewDetails={() => {
                // Simple view details - could open a modal or navigate
                console.log('View details for car:', car.id);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
