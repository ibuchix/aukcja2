
import { CarListing } from "@/types/cars";

/**
 * Transform blob URLs to make them accessible from the current domain
 */
const transformImageUrl = (url: string): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!url) return "/placeholder.svg";
  
  // If it's already a regular URL (not blob), return as is
  if (!url.startsWith('blob:')) {
    return url;
  }
  
  try {
    // Extract the blob ID from the URL
    const blobMatch = url.match(/blob:https?:\/\/[^\/]+\/(.+)/);
    if (blobMatch && blobMatch[1]) {
      const blobId = blobMatch[1];
      
      // Try to construct a working URL using the current origin
      const currentOrigin = window.location.origin;
      const transformedUrl = `${currentOrigin}/api/blob/${blobId}`;
      
      if (isDev) {
        console.log('Transforming blob URL:', {
          original: url,
          blobId,
          transformed: transformedUrl
        });
      }
      
      return transformedUrl;
    }
  } catch (error) {
    if (isDev) {
      console.warn('Error transforming blob URL:', error);
    }
  }
  
  // If transformation fails, try to use the original URL
  return url;
};

/**
 * Gets the primary image for a car listing with proper blob URL handling
 */
export const getPrimaryImage = (car: CarListing): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== PRIMARY IMAGE SEARCH ===');
    console.log('Car:', {
      id: car.id,
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
    
    if (isDev) {
      console.log('Required photos object:', photos);
      console.log('Available photo keys:', Object.keys(photos));
    }
    
    // Check for exterior_front first (most important)
    if (photos.exterior_front && typeof photos.exterior_front === 'string') {
      const transformedUrl = transformImageUrl(photos.exterior_front);
      if (isDev) console.log('Found exterior_front:', photos.exterior_front, '→', transformedUrl);
      return transformedUrl;
    }
    
    // Check for front property (alternative naming)
    if (photos.front && typeof photos.front === 'string') {
      const transformedUrl = transformImageUrl(photos.front);
      if (isDev) console.log('Found front:', photos.front, '→', transformedUrl);
      return transformedUrl;
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
        const transformedUrl = transformImageUrl(photos[photoKey]!);
        if (isDev) console.log(`Found ${photoKey}:`, photos[photoKey], '→', transformedUrl);
        return transformedUrl;
      }
    }

    // Check any available photo in required_photos
    const anyPhoto = Object.values(photos).find(photo => photo && typeof photo === 'string');
    if (anyPhoto) {
      const transformedUrl = transformImageUrl(anyPhoto);
      if (isDev) console.log('Found any required photo:', anyPhoto, '→', transformedUrl);
      return transformedUrl;
    }
  }
  
  // Fall back to images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const firstImage = car.images[0];
    if (firstImage && typeof firstImage === 'string') {
      const transformedUrl = transformImageUrl(firstImage);
      if (isDev) console.log('Found image from images array:', firstImage, '→', transformedUrl);
      return transformedUrl;
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
    console.log('=== ALL IMAGES SEARCH ===');
    console.log('Car:', {
      id: car.id,
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
        const transformedUrl = transformImageUrl(value);
        allImages.push({
          src: transformedUrl,
          label: key.replace(/_/g, " ").toUpperCase()
        });
        
        if (isDev) {
          console.log(`Added required photo ${key}:`, value, '→', transformedUrl);
        }
      }
    });
  }

  // Add images from images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    car.images.forEach((image, index) => {
      if (image && typeof image === 'string') {
        const transformedUrl = transformImageUrl(image);
        allImages.push({
          src: transformedUrl,
          label: `ADDITIONAL IMAGE ${index + 1}`
        });
        
        if (isDev) {
          console.log(`Added image ${index + 1}:`, image, '→', transformedUrl);
        }
      }
    });
  }

  if (isDev) {
    console.log('Total images found:', allImages.length);
    console.log('Final images list:', allImages);
  }

  return allImages;
};
