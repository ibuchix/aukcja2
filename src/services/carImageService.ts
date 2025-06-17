
import { supabase } from "@/integrations/supabase/client";
import { listCarImages } from "@/utils/storage/carImageStorage";

/**
 * Service to manage car images and fix missing URLs in database records
 */

/**
 * Fix a single car's image URLs by checking storage and updating database
 */
export const fixCarImageUrls = async (carId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Fixing image URLs for car ${carId}`);
    
    // Get current car data
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, images, required_photos, additional_photos')
      .eq('id', carId)
      .single();

    if (carError || !car) {
      return { success: false, message: `Car not found: ${carError?.message}` };
    }

    // Get images from storage
    const storageImages = await listCarImages(carId);
    
    if (storageImages.length === 0) {
      return { success: true, message: 'No images found in storage for this car' };
    }

    console.log(`Found ${storageImages.length} images in storage for car ${carId}`);

    // Check if database already has proper URLs
    const hasValidImages = car.images && Array.isArray(car.images) && car.images.length > 0;
    const hasValidRequiredPhotos = car.required_photos && typeof car.required_photos === 'object';

    if (hasValidImages && hasValidRequiredPhotos) {
      return { success: true, message: 'Car already has valid image URLs' };
    }

    // Update the car record with storage URLs
    const updateData: any = {};
    
    // If images array is empty, populate it with storage URLs
    if (!hasValidImages) {
      updateData.images = storageImages;
    }

    // If required_photos is empty, try to categorize images
    if (!hasValidRequiredPhotos) {
      const requiredPhotos: Record<string, string> = {};
      
      // Simple categorization based on filename patterns
      storageImages.forEach((url, index) => {
        const filename = url.split('/').pop()?.toLowerCase() || '';
        
        if (filename.includes('front') || filename.includes('exterior_front')) {
          requiredPhotos.exterior_front = url;
        } else if (filename.includes('rear') || filename.includes('exterior_rear')) {
          requiredPhotos.exterior_rear = url;
        } else if (filename.includes('left') || filename.includes('exterior_left')) {
          requiredPhotos.exterior_left = url;
        } else if (filename.includes('right') || filename.includes('exterior_right')) {
          requiredPhotos.exterior_right = url;
        } else if (filename.includes('interior')) {
          requiredPhotos[`interior_${Object.keys(requiredPhotos).filter(k => k.startsWith('interior')).length + 1}`] = url;
        } else {
          // Default categorization
          requiredPhotos[`general_${index + 1}`] = url;
        }
      });
      
      updateData.required_photos = requiredPhotos;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', carId);

    if (updateError) {
      console.error('Error updating car images:', updateError);
      return { success: false, message: `Database update failed: ${updateError.message}` };
    }

    return { 
      success: true, 
      message: `Successfully updated ${storageImages.length} image URLs for car ${carId}` 
    };
  } catch (error) {
    console.error('Exception in fixCarImageUrls:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Fix image URLs for all cars that might have missing URLs
 */
export const fixAllCarImageUrls = async (): Promise<{ 
  success: boolean; 
  message: string; 
  results: Array<{ carId: string; success: boolean; message: string }> 
}> => {
  try {
    // Get all cars that might need fixing (those with empty or null image arrays)
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, title, images, required_photos')
      .or('images.is.null,required_photos.is.null');

    if (carsError) {
      return { success: false, message: `Error fetching cars: ${carsError.message}`, results: [] };
    }

    if (!cars || cars.length === 0) {
      return { success: true, message: 'No cars found that need image URL fixes', results: [] };
    }

    console.log(`Found ${cars.length} cars that might need image URL fixes`);

    const results: Array<{ carId: string; success: boolean; message: string }> = [];

    // Process each car
    for (const car of cars) {
      const result = await fixCarImageUrls(car.id);
      results.push({
        carId: car.id,
        success: result.success,
        message: result.message
      });
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      message: `Processed ${cars.length} cars. ${successCount} successfully fixed.`,
      results
    };
  } catch (error) {
    console.error('Exception in fixAllCarImageUrls:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      results: []
    };
  }
};

/**
 * Get storage status for debugging
 */
export const getStorageStatus = async (): Promise<{
  bucketExists: boolean;
  totalImages: number;
  carsWithImages: number;
  message: string;
}> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      return {
        bucketExists: false,
        totalImages: 0,
        carsWithImages: 0,
        message: `Error checking buckets: ${bucketError.message}`
      };
    }

    const bucketExists = buckets?.some(bucket => bucket.id === 'car-images') || false;

    if (!bucketExists) {
      return {
        bucketExists: false,
        totalImages: 0,
        carsWithImages: 0,
        message: 'Car images bucket does not exist'
      };
    }

    // Get cars with images
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, images, required_photos')
      .not('images', 'is', null);

    const carsWithImages = cars?.length || 0;

    return {
      bucketExists: true,
      totalImages: 0, // Would need to count all files in storage
      carsWithImages,
      message: `Bucket exists. ${carsWithImages} cars have image data in database.`
    };
  } catch (error) {
    return {
      bucketExists: false,
      totalImages: 0,
      carsWithImages: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
