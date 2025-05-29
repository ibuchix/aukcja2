
import { CarListing } from "@/types/cars";

/**
 * Gets the primary image for a car listing with fallback logic
 */
export const getPrimaryImage = (car: CarListing): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('Getting primary image for car:', {
      carId: car.id,
      requiredPhotos: car.required_photos,
      images: car.images
    });
  }

  // First check required_photos for exterior front
  if (car.required_photos && typeof car.required_photos === 'object') {
    // Handle both string and object formats of required_photos
    const photos = car.required_photos as Record<string, string | null>;
    
    if (photos.exterior_front) {
      if (isDev) console.log('Found exterior_front:', photos.exterior_front);
      return photos.exterior_front;
    }
    
    // Check for front property (alternative naming)
    if (photos.front) {
      if (isDev) console.log('Found front:', photos.front);
      return photos.front;
    }
    
    // Then check other exterior photos in required_photos
    const exteriorPhotos = [
      photos.exterior_rear,
      photos.exterior_left,
      photos.exterior_right,
      photos.rear,
      photos.left,
      photos.right
    ].filter(Boolean);
    
    if (exteriorPhotos.length > 0) {
      if (isDev) console.log('Found other exterior photo:', exteriorPhotos[0]);
      return exteriorPhotos[0]!;
    }

    // Check any available photo in required_photos
    const anyPhoto = Object.values(photos).find(photo => photo && typeof photo === 'string');
    if (anyPhoto) {
      if (isDev) console.log('Found any required photo:', anyPhoto);
      return anyPhoto;
    }
  }
  
  // Fall back to images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    if (isDev) console.log('Found image from images array:', car.images[0]);
    return car.images[0];
  }
  
  if (isDev) console.log('No image found, using placeholder');
  return "/placeholder.svg";
};

/**
 * Gets all available images from a car listing
 */
export const getAllCarImages = (car: CarListing): { src: string; label: string }[] => {
  const allImages: { src: string; label: string }[] = [];

  // Add images from required_photos
  if (car.required_photos && typeof car.required_photos === 'object') {
    const photos = car.required_photos as Record<string, string | null>;
    
    Object.entries(photos).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        allImages.push({
          src: value,
          label: key.replace(/_/g, " ").toUpperCase()
        });
      }
    });
  }

  // Add images from images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    car.images.forEach((image, index) => {
      if (image && typeof image === 'string') {
        allImages.push({
          src: image,
          label: `ADDITIONAL IMAGE ${index + 1}`
        });
      }
    });
  }

  return allImages;
};
