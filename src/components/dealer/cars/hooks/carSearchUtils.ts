
import { CarListing } from "@/types/cars";

// Type guard to ensure we only process valid CarListing objects with reserve prices
export const isValidCarListing = (item: any): item is CarListing => {
  const isDev = process.env.NODE_ENV === 'development';
  
  const isValid = item && 
         typeof item === 'object' && 
         'id' in item && 
         typeof item.id === 'string' &&
         !('error' in item) &&
         typeof item.reserve_price === 'number' &&
         item.reserve_price > 0; // Only accept cars with reserve_price > 0
  
  if (isDev && !isValid) {
    console.log('Invalid car listing found:', {
      item,
      hasId: 'id' in item,
      idType: typeof item?.id,
      hasReservePrice: 'reserve_price' in item,
      reservePriceType: typeof item?.reserve_price,
      reservePriceValue: item?.reserve_price,
      reservePriceValid: typeof item?.reserve_price === 'number' && item?.reserve_price > 0,
      hasError: 'error' in item
    });
  }
  
  return isValid;
};

// Process car listings from database - only include cars with valid reserve prices
export const processCarListings = (rawData: any[]): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== RAW DATA PROCESSING START ===');
    console.log('Raw data count:', rawData.length);
    console.log('Sample raw item:', rawData[0]);
  }
  
  const validCars = rawData.filter(isValidCarListing);
  
  if (isDev) {
    console.log('=== RESERVE PRICE FILTERING ===');
    rawData.forEach((car, index) => {
      if (car && typeof car === 'object') {
        console.log(`Car ${index + 1} (${car.make} ${car.model}):`, {
          id: car.id,
          reserve_price: car.reserve_price,
          reserve_price_type: typeof car.reserve_price,
          reserve_price_valid: typeof car.reserve_price === 'number' && car.reserve_price > 0,
          will_be_included: typeof car.reserve_price === 'number' && car.reserve_price > 0
        });
      }
    });
    
    console.log('=== FILTERING RESULTS ===');
    console.log('Total raw cars:', rawData.length);
    console.log('Valid cars with reserve_price > 0:', validCars.length);
    console.log('Cars filtered out:', rawData.length - validCars.length);
  }
  
  return validCars;
};

// Calculate pagination info
export const calculatePagination = (currentPage: number, pageSize: number, total?: number) => {
  const canGoNext = total ? currentPage * pageSize < total : false;
  const canGoBack = currentPage > 1;
  
  return { canGoNext, canGoBack };
};
