
import { CarListing } from "@/types/cars";
import { listCarImages } from "../storage/carImageStorage";
import { isValidImageUrl } from "./validation";
import { transformImageUrl } from "./transformation";

/**
 * Car image fetching utilities
 */

/**
 * Fetch images from storage for a car when database records are missing
 */
export const fetchImagesFromStorage = async (carId: string): Promise<string[]> => {
  try {
    const storageImages = await listCarImages(carId);
    console.log(`Found ${storageImages.length} images in storage for car ${carId}`);
    return storageImages;
  } catch (error) {
    console.error('Error fetching images from storage for car', carId, error);
    return [];
  }
};

/**
 * Gets the primary image for a car listing with automatic storage fallback
 */
export const getPrimaryImage = (car: CarListing): string => {
  // First check requiredPhotos for exterior front
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    
    // Check for exterior_front first (most important)
    if (photos.exterior_front && isValidImageUrl(photos.exterior_front)) {
      return transformImageUrl(photos.exterior_front, car.id);
    }
    
    // Check for front property (alternative naming)
    if (photos.front && isValidImageUrl(photos.front)) {
      return transformImageUrl(photos.front, car.id);
    }
    
    // Then check other exterior photos in priority order
    const exteriorPhotoPriority = [
      'exterior_rear',
      'exterior_left', 
      'exterior_right',
      'rear',
      'left',
      'right'
    ];
    
    for (const photoKey of exteriorPhotoPriority) {
      if (photos[photoKey] && isValidImageUrl(photos[photoKey]!)) {
        return transformImageUrl(photos[photoKey]!, car.id);
      }
    }

    // Check any available photo in requiredPhotos
    const anyPhoto = Object.values(photos).find(photo => photo && isValidImageUrl(photo));
    if (anyPhoto) {
      return transformImageUrl(anyPhoto, car.id);
    }
  }
  
  // Fall back to images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const firstValidImage = car.images.find(image => image && isValidImageUrl(image));
    if (firstValidImage) {
      return transformImageUrl(firstValidImage, car.id);
    }
  }
  
  // If no images found in database, the component will trigger storage fallback
  return "/placeholder.svg";
};

/**
 * Gets all available images from a car listing with automatic storage fallback
 */
export const getAllCarImages = (car: CarListing): { src: string; label: string }[] => {
  const allImages: { src: string; label: string }[] = [];

  // Add images from requiredPhotos with proper labeling
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    
    Object.entries(photos).forEach(([key, value]) => {
      if (value && isValidImageUrl(value)) {
        const transformedUrl = transformImageUrl(value, car.id);
        allImages.push({
          src: transformedUrl,
          label: key.replace(/_/g, " ").toUpperCase()
        });
      }
    });
  }

  // Add images from images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    car.images.forEach((image, index) => {
      if (image && isValidImageUrl(image)) {
        const transformedUrl = transformImageUrl(image, car.id);
        allImages.push({
          src: transformedUrl,
          label: `ADDITIONAL IMAGE ${index + 1}`
        });
      }
    });
  }

  return allImages;
};

/**
 * Get the count of valid images for a car
 */
export const getImageCount = (car: CarListing): number => {
  let count = 0;
  
  // Count images from requiredPhotos
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    Object.values(photos).forEach(photo => {
      if (photo && isValidImageUrl(photo)) {
        count++;
      }
    });
  }
  
  // Count images from images array
  if (car.images && Array.isArray(car.images)) {
    car.images.forEach(image => {
      if (image && isValidImageUrl(image)) {
        count++;
      }
    });
  }
  
  return count;
};
