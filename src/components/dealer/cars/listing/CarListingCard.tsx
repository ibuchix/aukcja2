
import React from "react";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { getPrimaryImage } from "@/utils/imageUtils";

interface CarListingCardProps {
  car: CarListing;
  onViewDetails: (car: CarListing) => void;
}

export const CarListingCard = ({ car, onViewDetails }: CarListingCardProps) => {
  const primaryImage = getPrimaryImage(car);
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('CarListingCard rendering:', {
      carId: car.id,
      primaryImage,
      reservePrice: car.reserve_price
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img 
          src={primaryImage} 
          alt={car.title || `${car.year} ${car.make} ${car.model}`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            if (isDev) {
              console.log('Image failed to load:', primaryImage);
            }
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
          onLoad={() => {
            if (isDev) {
              console.log('Image loaded successfully:', primaryImage);
            }
          }}
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold line-clamp-1">
          {car.title || `${car.year} ${car.make} ${car.model}`}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {car.year} · {car.make}
          </span>
          <span className="font-medium">
            {formatCurrency(car.reserve_price)}
          </span>
        </div>
        {car.is_auction ? (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Upcoming Auction
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
            Available
          </span>
        )}
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewDetails(car)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};
