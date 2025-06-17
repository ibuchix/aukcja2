
import { getCarImagePublicUrl } from "../storage/carImageStorage";
import { isValidImageUrl } from "./validation";

/**
 * Image transformation utilities
 */

/**
 * Transform a database URL to a proper storage URL if needed
 */
export const transformImageUrl = (url: string, carId?: string): string => {
  if (!url) return "/placeholder.svg";
  
  // If it's already a valid URL, return as is
  if (isValidImageUrl(url)) {
    return url;
  }
  
  // If it looks like a storage file name and we have a car ID, construct the URL
  if (carId && url && !url.includes('/') && !url.startsWith('http')) {
    // This might be just a filename, construct the full storage URL
    return getCarImagePublicUrl(carId, url);
  }
  
  // If it's a blob URL, we cannot transform it
  if (url.startsWith('blob:')) {
    console.error('Blob URL found in database - this indicates a storage issue:', url);
    return "/placeholder.svg";
  }
  
  return "/placeholder.svg";
};
