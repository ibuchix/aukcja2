
import React from "react";
import { CarListing } from "@/types/cars";
import { CarListingCard } from "./CarListingCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CarListingsGridProps {
  listings: CarListing[];
  isLoading: boolean;
}

export const CarListingsGrid = ({ listings, isLoading }: CarListingsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No cars found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((car) => (
        <CarListingCard key={car.id} car={car} />
      ))}
    </div>
  );
};
