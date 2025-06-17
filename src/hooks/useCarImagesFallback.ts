
import { useState, useEffect } from "react";
import { CarListing } from "@/types/cars";
import { listCarImages } from "@/utils/storage/carImageStorage";
import { getImageCount } from "@/utils/imageUtils";

/**
 * Hook to automatically fetch images from storage when database records are missing
 */
export const useCarImagesFallback = (car: CarListing) => {
  const [storageImages, setStorageImages] = useState<string[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);

  useEffect(() => {
    const hasValidImages = getImageCount(car) > 0;
    
    // Only attempt storage fallback if:
    // 1. No valid images in database
    // 2. Car has an ID
    // 3. Haven't already attempted fallback for this car
    if (!hasValidImages && car.id && !hasAttemptedFallback) {
      setIsLoadingStorage(true);
      
      listCarImages(car.id)
        .then(images => {
          console.log(`Storage fallback: Found ${images.length} images for car ${car.id}`);
          setStorageImages(images);
          setHasAttemptedFallback(true);
        })
        .catch(error => {
          console.error('Error fetching storage images for car', car.id, error);
          setStorageImages([]);
          setHasAttemptedFallback(true);
        })
        .finally(() => {
          setIsLoadingStorage(false);
        });
    }
  }, [car.id, car.images, car.requiredPhotos, hasAttemptedFallback]);

  // Reset when car changes
  useEffect(() => {
    setHasAttemptedFallback(false);
    setStorageImages([]);
  }, [car.id]);

  const getPrimaryImageWithFallback = () => {
    // Try database images first
    const dbImageCount = getImageCount(car);
    if (dbImageCount > 0) {
      // Use existing logic from imageUtils
      return null; // Let existing logic handle it
    }
    
    // Use storage fallback
    return storageImages[0] || "/placeholder.svg";
  };

  const getAllImagesWithFallback = () => {
    // Try database images first
    const dbImageCount = getImageCount(car);
    if (dbImageCount > 0) {
      return null; // Let existing logic handle it
    }
    
    // Use storage fallback
    return storageImages.map((url, index) => ({
      src: url,
      label: `STORAGE IMAGE ${index + 1}`
    }));
  };

  const getTotalImageCount = () => {
    const dbCount = getImageCount(car);
    return dbCount > 0 ? dbCount : storageImages.length;
  };

  return {
    storageImages,
    isLoadingStorage,
    hasAttemptedFallback,
    getPrimaryImageWithFallback,
    getAllImagesWithFallback,
    getTotalImageCount
  };
};
