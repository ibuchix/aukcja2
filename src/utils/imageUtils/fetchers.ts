
import { CarListing } from "@/types/cars";
import { listCarImages } from "../storage/carImageStorage";
import { isValidImageUrl } from "./validation";
import { transformImageUrl } from "./transformation";
import { 
  fetchCarFileUploadsById, 
  getPrimaryImageFromUploads, 
  getAllImagesFromUploads, 
  getImageCountFromUploads,
  CarFileUpload 
} from "./carFileUploads";

/**
 * Car image fetching utilities
 */

/**
 * Fetch images from storage for a car when database records are missing
 */
export const fetchImagesFromStorage = async (carId: string): Promise<string[]> => {
  try {
    const storageImages = await listCarImages(carId);
    console.log(`Found ${storageImages.length} images in storage for car ${carId}`);
    return storageImages;
  } catch (error) {
    console.error('Error fetching images from storage for car', carId, error);
    return [];
  }
};

/**
 * Gets the primary image for a car listing using car_file_uploads
 */
export const getPrimaryImage = (car: CarListing): string => {
  console.log('🖼️ [GET PRIMARY IMAGE]', {
    carId: car.id,
    carTitle: car.title,
    hasFileUploads: !!car.fileUploads,
    fileUploadsLength: car.fileUploads?.length,
    fileUploadsType: Array.isArray(car.fileUploads) ? 'array' : typeof car.fileUploads,
    firstUpload: car.fileUploads && car.fileUploads.length > 0 
      ? { category: car.fileUploads[0].category, file_path: car.fileUploads[0].file_path }
      : 'none'
  });

  // Check if car has file uploads data
  if (car.fileUploads && Array.isArray(car.fileUploads) && car.fileUploads.length > 0) {
    const primaryImageUrl = getPrimaryImageFromUploads(car.fileUploads);
    console.log('✅ [PRIMARY IMAGE URL]', primaryImageUrl);
    return primaryImageUrl;
  }
  
  console.error('❌ No file uploads found for car:', car.id, car.title);
  // NO PLACEHOLDER - Return empty string to see the actual issue
  return "";
};

/**
 * Gets all available images from a car listing using car_file_uploads
 */
export const getAllCarImages = (car: CarListing): { src: string; label: string }[] => {
  // Check if car has file uploads data
  if (car.fileUploads && Array.isArray(car.fileUploads) && car.fileUploads.length > 0) {
    return getAllImagesFromUploads(car.fileUploads);
  }
  
  return [];
};

/**
 * Get the count of valid images for a car using car_file_uploads
 */
export const getImageCount = (car: CarListing): number => {
  // Check if car has file uploads data
  if (car.fileUploads && Array.isArray(car.fileUploads) && car.fileUploads.length > 0) {
    return getImageCountFromUploads(car.fileUploads);
  }
  
  return 0;
};
