
import { CarListing } from "@/types/cars";
import { getPrimaryImage, getAllCarImages, getImageCount } from "./fetchers";

/**
 * Debug utilities for car images
 */

/**
 * Debug function to check car image data
 */
export const debugCarImages = (car: CarListing) => {
  console.log('=== CAR IMAGE DEBUG ===');
  console.log('Car ID:', car.id);
  console.log('Title:', car.title);
  console.log('Images array:', car.images);
  console.log('Required photos:', car.requiredPhotos);
  console.log('Additional photos:', car.additionalPhotos);
  console.log('Primary image result:', getPrimaryImage(car));
  console.log('All images result:', getAllCarImages(car));
  console.log('Image count:', getImageCount(car));
  console.log('======================');
};
