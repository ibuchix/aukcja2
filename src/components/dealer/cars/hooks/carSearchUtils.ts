
import { CarListing } from "@/types/cars";

// Type guard to ensure we only process valid CarListing objects
export const isValidCarListing = (item: any): item is CarListing => {
  const isValid = item && 
         typeof item === 'object' && 
         'id' in item && 
         typeof item.id === 'string' &&
         !('error' in item) &&
         typeof item.price === 'number';
  
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && !isValid) {
    console.log('Invalid car listing found:', item);
  }
  
  return isValid;
};

// Process car listings from database
export const processCarListings = (rawData: any[]): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  const validCars = rawData.filter(isValidCarListing);
  
  if (isDev) {
    console.log('Raw vs Processed Data Analysis:', {
      rawCount: rawData.length,
      validCount: validCars.length,
      reservePriceData: validCars.map(car => ({ 
        id: car.id, 
        make: car.make, 
        model: car.model, 
        reserve_price: car.reserve_price,
        reserve_price_type: typeof car.reserve_price
      })),
      imageData: validCars.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        required_photos: car.required_photos,
        required_photos_type: typeof car.required_photos,
        images: car.images,
        images_type: typeof car.images
      }))
    });
  }
  
  return validCars;
};

// Calculate pagination info
export const calculatePagination = (currentPage: number, pageSize: number, total?: number) => {
  const canGoNext = total ? currentPage * pageSize < total : false;
  const canGoBack = currentPage > 1;
  
  return { canGoNext, canGoBack };
};
