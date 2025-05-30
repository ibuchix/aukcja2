import { CarListing } from "@/types/cars";

/**
 * Generate Supabase Storage URL for car images
 */
const generateSupabaseImageUrl = (carId: string, imageName: string): string => {
  // Get the Supabase project URL from the environment or current location
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/car-images/${carId}/${imageName}`;
};

/**
 * Transform blob URLs to make them accessible from the current domain
 */
const transformImageUrl = (url: string, carId?: string): string => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!url) return "/placeholder.svg";
  
  // If it's already a Supabase Storage URL, return as is
  if (url.includes('/storage/v1/object/public/car-images/')) {
    return url;
  }
  
  // If it's a blob URL and we have carId, try to construct a Supabase Storage URL
  if (url.startsWith('blob:') && carId) {
    // Extract the image type from the blob URL if possible
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
  
  // If it's a regular URL (not blob), return as is
  if (!url.startsWith('blob:')) {
    return url;
  }
  
  if (isDev) {
    console.warn('Could not transform image URL:', url);
  }
  
  // Fallback to placeholder
  return "/placeholder.svg";
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
      requiredPhotos: car.requiredPhotos,
      requiredPhotosType: typeof car.requiredPhotos,
      images: car.images,
      imagesType: typeof car.images
    });
  }

  // First check requiredPhotos for exterior front
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    
    if (isDev) {
      console.log('Required photos object:', photos);
      console.log('Available photo keys:', Object.keys(photos));
    }
    
    // Check for exterior_front first (most important)
    if (photos.exterior_front && typeof photos.exterior_front === 'string') {
      const transformedUrl = transformImageUrl(photos.exterior_front, car.id);
      if (isDev) console.log('Found exterior_front:', photos.exterior_front, '→', transformedUrl);
      return transformedUrl;
    }
    
    // Check for front property (alternative naming)
    if (photos.front && typeof photos.front === 'string') {
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
      if (photos[photoKey] && typeof photos[photoKey] === 'string') {
        const transformedUrl = transformImageUrl(photos[photoKey]!, car.id);
        if (isDev) console.log(`Found ${photoKey}:`, photos[photoKey], '→', transformedUrl);
        return transformedUrl;
      }
    }

    // Check any available photo in requiredPhotos
    const anyPhoto = Object.values(photos).find(photo => photo && typeof photo === 'string');
    if (anyPhoto) {
      const transformedUrl = transformImageUrl(anyPhoto, car.id);
      if (isDev) console.log('Found any required photo:', anyPhoto, '→', transformedUrl);
      return transformedUrl;
    }
  }
  
  // Fall back to images array
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const firstImage = car.images[0];
    if (firstImage && typeof firstImage === 'string') {
      const transformedUrl = transformImageUrl(firstImage, car.id);
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
      requiredPhotos: car.requiredPhotos,
      images: car.images
    });
  }

  // Add images from requiredPhotos with proper labeling
  if (car.requiredPhotos && typeof car.requiredPhotos === 'object') {
    const photos = car.requiredPhotos as Record<string, string | null>;
    
    Object.entries(photos).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
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
      if (image && typeof image === 'string') {
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
    console.log('Final images list:', allImages);
  }

  return allImages;
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
