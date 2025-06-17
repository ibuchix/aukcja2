
import { CAR_IMAGES_BUCKET } from "../storage/carImageStorage";

/**
 * Image upload utilities
 */

/**
 * Upload image to Supabase Storage for a specific car
 * This is the updated version that properly stores URLs in the database
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
      .from(CAR_IMAGES_BUCKET)
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully, public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    return null;
  }
};
