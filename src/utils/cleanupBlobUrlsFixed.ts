
import { supabase } from "@/integrations/supabase/client";

interface CleanupResult {
  success: boolean;
  message: string;
  carsUpdated?: number;
}

/**
 * Clean up blob URLs from car records in the database
 */
export const cleanupBlobUrls = async (): Promise<CleanupResult> => {
  try {
    console.log('Starting blob URL cleanup...');
    
    // Get all cars with potential blob URLs
    const { data: cars, error: fetchError } = await supabase
      .from('cars')
      .select('id, images, required_photos, additional_photos')
      .not('images', 'is', null);

    if (fetchError) {
      console.error('Error fetching cars:', fetchError);
      return {
        success: false,
        message: `Error fetching cars: ${fetchError.message}`
      };
    }

    if (!cars || cars.length === 0) {
      return {
        success: true,
        message: 'No cars found to process'
      };
    }

    let carsUpdated = 0;

    for (const car of cars) {
      // Type guard to ensure car is valid
      if (!car || typeof car !== 'object' || 'error' in car) {
        continue;
      }

      let needsUpdate = false;
      const updateData: any = {};

      // Check and clean images array
      if (car.images && Array.isArray(car.images)) {
        const cleanImages = car.images.filter((url: string) => {
          return url && typeof url === 'string' && !url.startsWith('blob:');
        });
        
        if (cleanImages.length !== car.images.length) {
          updateData.images = cleanImages;
          needsUpdate = true;
        }
      }

      // Check and clean required_photos
      if (car.required_photos && typeof car.required_photos === 'object') {
        const cleanRequiredPhotos: Record<string, string> = {};
        let hasChanges = false;
        
        for (const [key, value] of Object.entries(car.required_photos)) {
          if (value && typeof value === 'string' && !value.startsWith('blob:')) {
            cleanRequiredPhotos[key] = value;
          } else {
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          updateData.required_photos = cleanRequiredPhotos;
          needsUpdate = true;
        }
      }

      // Check and clean additional_photos
      if (car.additional_photos && typeof car.additional_photos === 'object') {
        const cleanAdditionalPhotos: Record<string, any> = {};
        let hasChanges = false;
        
        for (const [key, value] of Object.entries(car.additional_photos)) {
          if (value && typeof value === 'string' && !value.startsWith('blob:')) {
            cleanAdditionalPhotos[key] = value;
          } else {
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          updateData.additional_photos = cleanAdditionalPhotos;
          needsUpdate = true;
        }
      }

      // Update the car if needed
      if (needsUpdate && 'id' in car) {
        console.log(`Cleaning blob URLs for car ${car.id}`);
        
        const { error: updateError } = await supabase
          .from('cars')
          .update(updateData)
          .eq('id', car.id);

        if (updateError) {
          console.error(`Error updating car ${car.id}:`, updateError);
        } else {
          carsUpdated++;
        }
      }
    }

    return {
      success: true,
      message: `Cleanup completed. Updated ${carsUpdated} cars.`,
      carsUpdated
    };
  } catch (error) {
    console.error('Exception in cleanupBlobUrls:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
