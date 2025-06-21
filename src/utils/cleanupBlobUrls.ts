
import { supabase } from "@/integrations/supabase/client";

interface CleanupResult {
  success: boolean;
  message: string;
}

// Type guard for car data
interface ValidCarData {
  id: string;
  images?: string[] | null;
  required_photos?: Record<string, any> | null;
  additional_photos?: any[] | null;
  [key: string]: any;
}

function isValidCar(car: any): car is ValidCarData {
  return car && 
         car !== null &&
         typeof car === 'object' && 
         !('error' in car) && 
         'id' in car && 
         typeof car.id === 'string';
}

/**
 * Function to clean up blob URLs in the database
 * This should be run once to fix existing data
 */
export const cleanupBlobUrlsInDatabase = async (): Promise<CleanupResult> => {
  try {
    console.log('Starting blob URL cleanup...');
    
    // Get all cars that might have blob URLs
    const { data: carsData, error: fetchError } = await supabase
      .from('cars')
      .select('id, images, required_photos, additional_photos');
    
    if (fetchError) {
      console.error('Error fetching cars:', fetchError);
      return { success: false, message: `Failed to fetch cars: ${fetchError.message}` };
    }
    
    if (!carsData || carsData.length === 0) {
      return { success: true, message: 'No cars found with image data' };
    }
    
    let updatedCount = 0;
    
    for (const carData of carsData) {
      if (!isValidCar(carData)) {
        continue;
      }
      
      const car = carData; // Now TypeScript knows this is ValidCarData
      let needsUpdate = false;
      let updatedData: any = {};
      
      // Check and clean images array with safe property access
      if (car.images && Array.isArray(car.images)) {
        const cleanedImages = car.images.map((img: string) => {
          if (img && img.startsWith('blob:')) {
            needsUpdate = true;
            return null; // Remove blob URLs
          }
          return img;
        }).filter(Boolean); // Remove null entries
        
        if (needsUpdate) {
          updatedData.images = cleanedImages;
        }
      }
      
      // Check and clean required_photos object with safe property access
      if (car.required_photos && typeof car.required_photos === 'object') {
        const cleanedPhotos = { ...car.required_photos };
        Object.keys(cleanedPhotos).forEach(key => {
          if (cleanedPhotos[key] && typeof cleanedPhotos[key] === 'string' && cleanedPhotos[key].startsWith('blob:')) {
            cleanedPhotos[key] = null; // Remove blob URLs
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          updatedData.required_photos = cleanedPhotos;
        }
      }
      
      // Check and clean additional_photos with safe property access
      if (car.additional_photos && Array.isArray(car.additional_photos)) {
        const cleanedAdditional = car.additional_photos.map((img: any) => {
          if (typeof img === 'string' && img.startsWith('blob:')) {
            needsUpdate = true;
            return null;
          }
          return img;
        }).filter(Boolean);
        
        if (needsUpdate) {
          updatedData.additional_photos = cleanedAdditional;
        }
      }
      
      // Update the car if needed with safe property access
      if (needsUpdate && car.id) {
        const { error: updateError } = await supabase
          .from('cars')
          .update(updatedData)
          .eq('id', car.id);
        
        if (updateError) {
          console.error(`Error updating car ${car.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Cleaned blob URLs from car ${car.id}`);
        }
      }
    }
    
    return { 
      success: true, 
      message: `Successfully cleaned blob URLs from ${updatedCount} cars out of ${carsData.length} total cars` 
    };
    
  } catch (error) {
    console.error('Error during blob URL cleanup:', error);
    return { 
      success: false, 
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};
