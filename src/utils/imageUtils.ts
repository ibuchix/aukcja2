
import { CarListing } from "@/types/cars";

/**
 * Gets the primary image for a car listing with fallback logic
 */
export const getPrimaryImage = (car: CarListing): string => {
  // First check required_photos for exterior front
  if (car.required_photos?.exterior_front) {
    return car.required_photos.exterior_front;
  }
  
  // Check for front property (alternative naming)
  if (car.required_photos?.front) {
    return car.required_photos.front;
  }
  
  // Then check other exterior photos in required_photos
  if (car.required_photos) {
    const exteriorPhotos = [
      car.required_photos.exterior_rear,
      car.required_photos.exterior_left,
      car.required_photos.exterior_right,
      car.required_photos.rear,
      car.required_photos.left,
      car.required_photos.right
    ].filter(Boolean);
    
    if (exteriorPhotos.length > 0) {
      return exteriorPhotos[0]!;
    }
  }
  
  // Fall back to images array
  if (car.images && car.images.length > 0) {
    return car.images[0];
  }
  
  return "/placeholder.svg";
};

/**
 * Gets all available images from a car listing
 */
export const getAllCarImages = (car: CarListing): { src: string; label: string }[] => {
  const allImages: { src: string; label: string }[] = [];

  // Add images from required_photos
  if (car.required_photos) {
    Object.entries(car.required_photos).forEach(([key, value]) => {
      if (value) {
        allImages.push({
          src: value,
          label: key.replace(/_/g, " ").toUpperCase()
        });
      }
    });
  }

  // Add images from images array
  if (car.images && car.images.length > 0) {
    car.images.forEach((image, index) => {
      allImages.push({
        src: image,
        label: `ADDITIONAL IMAGE ${index + 1}`
      });
    });
  }

  return allImages;
};
