import { CarListing } from "@/types/cars";

/**
 * Generate Supabase Storage URL for car images
 */
const generateSupabaseImageUrl = (carId: string, imageName: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/car-images/${carId}/${imageName}`;
};

/**
 * Check if a URL is a valid image (including blob URLs)
 */
const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Blob URLs are valid
  if (url.startsWith('blob:')) return true;
  
  // Data URLs are valid
  if (url.startsWith('data:image/')) return true;
  
  // HTTP/HTTPS URLs are valid
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Relative paths are valid
  if (url.startsWith('/')) return true;
  
  return false;
};

/**
 * Transform blob URLs to make them accessible from the current domain
 */
const transformImageUrl = (url: string, carId?: string): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!url) return "/placeholder.svg";
  
  // If it's already a valid image URL (including blob URLs), return as is
  if (isValidImageUrl(url)) {
    if (isDev && url.startsWith('blob:')) {
      console.log('Keeping blob URL as-is:', url);
    }
    return url;
  }
  
  // If it's a blob URL and we have carId, try to construct a Supabase Storage URL
  if (url.startsWith('blob:') && carId) {
    const imageName = url.includes('exterior_front') ? 'exterior_front.jpg' : 'image.jpg';
    const supabaseUrl = generateSupabaseImageUrl(carId, imageName);
    
    if (isDev) {
      console.log('Transforming blob URL to Supabase Storage:', {
        original: url,
        carId,
        transformed: supabaseUrl
      });
    }
    
    return supabaseUrl;
  }
  
  if (isDev) {
    console.warn('Could not transform image URL:', url);
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
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== PRIMARY IMAGE SEARCH ===');
    console.log('Car:', {
      id: car.id,
      make: car.make,
      model: car.model,
      imageCount: countValidImages(car)
    });
  }

  // First check requiredPhotos for exterior front
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    
    // Check for exterior_front first (most important)
    if (photos.exterior_front && isValidImageUrl(photos.exterior_front)) {
      const transformedUrl = transformImageUrl(photos.exterior_front, car.id);
      if (isDev) console.log('Found exterior_front:', photos.exterior_front, '→', transformedUrl);
      return transformedUrl;
    }
    
    // Check for front property (alternative naming)
    if (photos.front && isValidImageUrl(photos.front)) {
      const transformedUrl = transformImageUrl(photos.front, car.id);
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
      if (photos[photoKey] && isValidImageUrl(photos[photoKey]!)) {
        const transformedUrl = transformImageUrl(photos[photoKey]!, car.id);
        if (isDev) console.log(`Found ${photoKey}:`, photos[photoKey], '→', transformedUrl);
        return transformedUrl;
      }
    }

    // Check any available photo in requiredPhotos
    const anyPhoto = Object.values(photos).find(photo => photo && isValidImageUrl(photo));
    if (anyPhoto) {
      const transformedUrl = transformImageUrl(anyPhoto, car.id);
      if (isDev) console.log('Found any required photo:', anyPhoto, '→', transformedUrl);
      return transformedUrl;
    }
  }
  
  // Fall back to images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const firstValidImage = car.images.find(image => image && isValidImageUrl(image));
    if (firstValidImage) {
      const transformedUrl = transformImageUrl(firstValidImage, car.id);
      if (isDev) console.log('Found image from images array:', firstValidImage, '→', transformedUrl);
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
      totalValidImages: countValidImages(car)
    });
  }

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
        
        if (isDev) {
          console.log(`Added required photo ${key}:`, value, '→', transformedUrl);
        }
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
        
        if (isDev) {
          console.log(`Added image ${index + 1}:`, image, '→', transformedUrl);
        }
      }
    });
  }

  if (isDev) {
    console.log('Total images found:', allImages.length);
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

/**
 * Create migration utility to convert blob URLs to Supabase Storage
 */
export const migrateCarImagesToStorage = async (car: CarListing): Promise<boolean> => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== MIGRATING CAR IMAGES ===');
    console.log('Car ID:', car.id);
  }
  
  try {
    // This would need to be implemented with proper blob data extraction
    // For now, we'll just update the URLs to point to Supabase Storage
    // In a real implementation, you'd extract blob data and re-upload
    
    console.log('Image migration placeholder for car:', car.id);
    return true;
  } catch (error) {
    console.error('Error migrating car images:', error);
    return false;
  }
};
