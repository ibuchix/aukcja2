
import { CarListing } from "@/types/cars";

// Type guard to ensure we only process valid CarListing objects
export const isValidCarListing = (item: any): item is CarListing => {
  const hasId = item && typeof item === 'object' && 'id' in item && typeof item.id === 'string';
  const hasNoError = !('error' in item);
  const hasValidReservePrice = typeof item?.reserve_price === 'number' && item.reserve_price >= 0;
  
  return hasId && hasNoError && hasValidReservePrice;
};

// Filter cars specifically for dealer dashboard - only cars with reserve_price > 0
export const filterCarsForDealerDashboard = (cars: CarListing[]): CarListing[] => {
  return cars.filter(car => car.reserve_price > 0);
};

// Process car listings from database - include all cars with valid reserve prices
export const processCarListings = (rawData: any[], applyDealerFilter: boolean = false): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== PROCESSING CARS ===');
    console.log('Raw data count:', rawData.length);
    console.log('Apply dealer filter:', applyDealerFilter);
  }
  
  const validCars = rawData.filter(item => {
    const isValid = isValidCarListing(item);
    if (isDev && !isValid) {
      console.log('Invalid car filtered out:', {
        id: item?.id,
        make: item?.make,
        model: item?.model,
        reserve_price: item?.reserve_price
      });
    }
    return isValid;
  });
  
  if (isDev) {
    console.log('Valid cars after validation:', validCars.length);
  }
  
  // Apply dealer-specific filter if requested
  if (applyDealerFilter) {
    const finalResult = filterCarsForDealerDashboard(validCars);
    if (isDev) {
      console.log('Cars after dealer filtering:', finalResult.length);
    }
    return finalResult;
  }
  
  return validCars;
};

// Calculate pagination info
export const calculatePagination = (currentPage: number, pageSize: number, total?: number) => {
  const canGoNext = total ? currentPage * pageSize < total : false;
  const canGoBack = currentPage > 1;
  
  return { canGoNext, canGoBack };
};
