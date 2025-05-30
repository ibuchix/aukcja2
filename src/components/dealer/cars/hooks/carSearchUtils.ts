
import { CarListing } from "@/types/cars";

// Type guard to ensure we only process valid CarListing objects
export const isValidCarListing = (item: any): item is CarListing => {
  const isDev = process.env.NODE_ENV === 'development';
  
  const isValid = item && 
         typeof item === 'object' && 
         'id' in item && 
         typeof item.id === 'string' &&
         !('error' in item) &&
         typeof item.reserve_price === 'number'; // Changed from price to reserve_price
  
  if (isDev && !isValid) {
    console.log('Invalid car listing found:', {
      item,
      hasId: 'id' in item,
      idType: typeof item?.id,
      hasReservePrice: 'reserve_price' in item,
      reservePriceType: typeof item?.reserve_price,
      hasError: 'error' in item
    });
  }
  
  return isValid;
};

// Process car listings from database - preserve ALL data
export const processCarListings = (rawData: any[]): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== RAW DATA PROCESSING START ===');
    console.log('Raw data count:', rawData.length);
    console.log('Sample raw item:', rawData[0]);
  }
  
  const validCars = rawData.filter(isValidCarListing);
  
  if (isDev) {
    console.log('=== RESERVE PRICE ANALYSIS ===');
    rawData.forEach((car, index) => {
      if (car && typeof car === 'object') {
        console.log(`Car ${index + 1} (${car.make} ${car.model}):`, {
          id: car.id,
          reserve_price: car.reserve_price,
          reserve_price_type: typeof car.reserve_price,
          reserve_price_null: car.reserve_price === null,
          reserve_price_undefined: car.reserve_price === undefined,
          all_price_fields: {
            price: car.price,
            reserve_price: car.reserve_price,
            current_bid: car.current_bid
          }
        });
      }
    });
    
    console.log('=== IMAGE ANALYSIS ===');
    rawData.forEach((car, index) => {
      if (car && typeof car === 'object') {
        console.log(`Car ${index + 1} (${car.make} ${car.model}) images:`, {
          id: car.id,
          required_photos: car.required_photos,
          required_photos_type: typeof car.required_photos,
          images: car.images,
          images_type: typeof car.images,
          images_length: Array.isArray(car.images) ? car.images.length : 'not array'
        });
      }
    });
    
    console.log('=== FILTERING RESULTS ===');
    console.log('Valid cars after filtering:', validCars.length);
    console.log('Cars with reserve price:', validCars.filter(car => 
      car.reserve_price !== null && car.reserve_price !== undefined && typeof car.reserve_price === 'number'
    ).length);
    console.log('Cars with images:', validCars.filter(car => 
      (car.images && Array.isArray(car.images) && car.images.length > 0) ||
      (car.required_photos && typeof car.required_photos === 'object' && car.required_photos !== null)
    ).length);
  }
  
  return validCars;
};

// Calculate pagination info
export const calculatePagination = (currentPage: number, pageSize: number, total?: number) => {
  const canGoNext = total ? currentPage * pageSize < total : false;
  const canGoBack = currentPage > 1;
  
  return { canGoNext, canGoBack };
};
