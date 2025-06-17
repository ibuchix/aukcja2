
import { supabase } from "@/integrations/supabase/client";

/**
 * Car image storage utilities for Supabase Storage
 */

export const CAR_IMAGES_BUCKET = 'car-images';

/**
 * Generate the public URL for a car image stored in Supabase Storage
 */
export const getCarImagePublicUrl = (carId: string, fileName: string): string => {
  const { data } = supabase.storage
    .from(CAR_IMAGES_BUCKET)
    .getPublicUrl(`${carId}/${fileName}`);
  
  return data.publicUrl;
};

/**
 * Upload a car image to Supabase Storage and return the public URL
 */
export const uploadCarImage = async (
  carId: string,
  file: File,
  imageType: string = 'general'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${imageType}_${Date.now()}.${fileExt}`;
    const filePath = `${carId}/${fileName}`;

    console.log(`Uploading image to: ${CAR_IMAGES_BUCKET}/${filePath}`);

    // Upload the file
    const { data, error } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL
    const publicUrl = getCarImagePublicUrl(carId, fileName);
    
    console.log(`Image uploaded successfully. Public URL: ${publicUrl}`);
    
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Exception during image upload:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * List all images for a specific car
 */
export const listCarImages = async (carId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .list(carId);

    if (error) {
      console.error('Error listing car images:', error);
      return [];
    }

    return data?.map(file => getCarImagePublicUrl(carId, file.name)) || [];
  } catch (error) {
    console.error('Exception listing car images:', error);
    return [];
  }
};

/**
 * Delete a car image from storage
 */
export const deleteCarImage = async (carId: string, fileName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .remove([`${carId}/${fileName}`]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting image:', error);
    return false;
  }
};

/**
 * Check if the car images bucket exists and create it if it doesn't
 */
export const ensureCarImagesBucket = async (): Promise<boolean> => {
  try {
    // Try to get bucket info to see if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.id === CAR_IMAGES_BUCKET);
    
    if (!bucketExists) {
      console.log('Car images bucket does not exist, this needs to be created by admin');
      return false;
    }

    console.log('Car images bucket exists and is ready');
    return true;
  } catch (error) {
    console.error('Exception checking bucket:', error);
    return false;
  }
};
