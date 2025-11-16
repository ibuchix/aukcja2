
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { getPrimaryImage, getAllCarImages } from "@/utils/imageUtils";
import { useCarImagesFallback } from "@/hooks/useCarImagesFallback";
import { useImagePrefetch } from "@/hooks/useImagePrefetch";
import { Camera } from "lucide-react";

interface CarListingCardProps {
  car: CarListing;
  onViewDetails: (car: CarListing) => void;
}

export const CarListingCard = ({ car, onViewDetails }: CarListingCardProps) => {
  const [imageError, setImageError] = useState(false);
  const { getPrimaryImageWithFallback, isLoadingStorage } = useCarImagesFallback(car);
  const { prefetchImages } = useImagePrefetch();
  
  // Get primary image with fallback support
  const primaryImageFromDb = getPrimaryImage(car);
  const primaryImageWithFallback = getPrimaryImageWithFallback();
  const finalPrimaryImage = primaryImageFromDb !== "/placeholder.svg" 
    ? primaryImageFromDb 
    : primaryImageWithFallback;

  const handleImageError = () => {
    setImageError(true);
  };

  const shouldShowPlaceholder = imageError || 
    (!finalPrimaryImage || finalPrimaryImage === "/placeholder.svg") && 
    !isLoadingStorage;

  const handleCardHover = () => {
    // Prefetch all car images when user hovers over card
    const allImages = getAllCarImages(car);
    if (allImages.length > 0) {
      const imageUrls = allImages
        .map(img => img.src)
        .filter(url => url && url !== '/placeholder.svg');
      if (imageUrls.length > 0) {
        prefetchImages(imageUrls);
      }
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
      onMouseEnter={handleCardHover}
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        {isLoadingStorage ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-500 text-sm">Loading images...</p>
            </div>
          </div>
        ) : shouldShowPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No image available</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-400 mt-1">ID: {car.id}</p>
              )}
            </div>
          </div>
        ) : (
          <img 
            src={finalPrimaryImage} 
            alt={car.title || `${car.year} ${car.make} ${car.model}`} 
            className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
            loading="lazy"
            onError={handleImageError}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            style={{ opacity: 0 }}
          />
        )}
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
            {formatCurrency(car.reservePrice)}
          </span>
        </div>
        {car.isAuction ? (
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
