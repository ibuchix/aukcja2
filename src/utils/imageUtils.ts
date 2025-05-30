
import { CarListing } from "@/types/cars";

/**
 * Generate Supabase Storage URL for car images
 */
const generateSupabaseImageUrl = (carId: string, imageName: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/car-images/${carId}/${imageName}`;
};

/**
 * Check if a URL is a valid image (NO blob URLs allowed)
 */
const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Reject blob URLs - they should not be in the database
  if (url.startsWith('blob:')) {
    console.warn('Blob URL detected - this should not be stored in database:', url);
    return false;
  }
  
  // Data URLs are valid
  if (url.startsWith('data:image/')) return true;
  
  // HTTP/HTTPS URLs are valid
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Relative paths are valid
  if (url.startsWith('/')) return true;
  
  return false;
};

/**
 * Transform image URL to proper storage URL
 */
const transformImageUrl = (url: string, carId?: string): string => {
  if (!url) return "/placeholder.svg";
  
  // If it's already a valid storage URL, return as is
  if (isValidImageUrl(url)) {
    return url;
  }
  
  // If it's a blob URL, we cannot transform it - it should have been stored properly
  if (url.startsWith('blob:')) {
    console.error('Blob URL found in database - this indicates a storage issue:', url);
    return "/placeholder.svg";
  }
  
  return "/placeholder.svg";
};

/**
 * Count valid images from car data
 */
const countValidImages = (car: CarListing): number => {
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

/**
 * Gets the primary image for a car listing with proper URL handling
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
  
  return "/placeholder.svg";
};

/**
 * Gets all available images from a car listing with proper handling
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
  return countValidImages(car);
};

/**
 * Upload image to Supabase Storage for a specific car
 */
export const uploadCarImageToStorage = async (
  carId: string, 
  file: File, 
  imageName: string
): Promise<string | null> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    
    const filePath = `${carId}/${imageName}`;
    
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    return generateSupabaseImageUrl(carId, imageName);
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    return null;
  }
};
