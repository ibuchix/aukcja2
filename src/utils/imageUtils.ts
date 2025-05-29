
import { CarListing } from "@/types/cars";

/**
 * Gets the primary image for a car listing with proper blob URL handling
 */
export const getPrimaryImage = (car: CarListing): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('Getting primary image for car:', {
      carId: car.id,
      make: car.make,
      model: car.model,
      requiredPhotos: car.required_photos,
      requiredPhotosType: typeof car.required_photos,
      images: car.images,
      imagesType: typeof car.images
    });
  }

  // First check required_photos for exterior front
  if (car.required_photos && typeof car.required_photos === 'object') {
    const photos = car.required_photos as Record<string, string | null>;
    
    // Check for exterior_front first (most important)
    if (photos.exterior_front && typeof photos.exterior_front === 'string') {
      if (isDev) console.log('Found exterior_front:', photos.exterior_front);
      return photos.exterior_front;
    }
    
    // Check for front property (alternative naming)
    if (photos.front && typeof photos.front === 'string') {
      if (isDev) console.log('Found front:', photos.front);
      return photos.front;
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
      if (photos[photoKey] && typeof photos[photoKey] === 'string') {
        if (isDev) console.log(`Found ${photoKey}:`, photos[photoKey]);
        return photos[photoKey]!;
      }
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
    const firstImage = car.images[0];
    if (firstImage && typeof firstImage === 'string') {
      if (isDev) console.log('Found image from images array:', firstImage);
      return firstImage;
    }
  }
  
  if (isDev) console.log('No image found, using placeholder');
  return "/placeholder.svg";
};

/**
 * Gets all available images from a car listing with proper handling
 */
export const getAllCarImages = (car: CarListing): { src: string; label: string }[] => {
  const allImages: { src: string; label: string }[] = [];
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('Getting all images for car:', {
      carId: car.id,
      make: car.make,
      model: car.model,
      requiredPhotos: car.required_photos,
      images: car.images
    });
  }

  // Add images from required_photos with proper labeling
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

  if (isDev) {
    console.log('All images found:', allImages);
  }

  return allImages;
};
