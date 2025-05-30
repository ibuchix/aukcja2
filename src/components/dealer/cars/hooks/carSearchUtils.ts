
import { CarListing } from "@/types/cars";

// Type guard to ensure we only process valid CarListing objects
export const isValidCarListing = (item: any): item is CarListing => {
  const isDev = process.env.NODE_ENV === 'development';
  
  const hasId = item && typeof item === 'object' && 'id' in item && typeof item.id === 'string';
  const hasNoError = !('error' in item);
  const hasValidReservePrice = typeof item?.reserve_price === 'number' && item.reserve_price >= 0;
  
  const isValid = hasId && hasNoError && hasValidReservePrice;
  
  if (isDev) {
    console.log('=== VALIDATING CAR LISTING ===');
    console.log('Car ID:', item?.id);
    console.log('Validation checks:', {
      hasId,
      hasNoError,
      hasValidReservePrice,
      reserve_price_value: item?.reserve_price,
      reserve_price_type: typeof item?.reserve_price,
      isValid
    });
    
    if (!isValid) {
      console.log('INVALID CAR LISTING:', {
        item,
        failureReasons: {
          missingId: !hasId,
          hasError: !hasNoError,
          invalidReservePrice: !hasValidReservePrice
        }
      });
    }
  }
  
  return isValid;
};

// Filter cars specifically for dealer dashboard - only cars with reserve_price > 0
export const filterCarsForDealerDashboard = (cars: CarListing[]): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== DEALER DASHBOARD FILTERING START ===');
    console.log('Input cars count:', cars.length);
    console.log('Cars with reserve prices:', cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      reserve_price: car.reserve_price,
      will_be_included: car.reserve_price > 0
    })));
  }
  
  const filteredCars = cars.filter(car => {
    const isIncluded = car.reserve_price > 0;
    if (isDev && !isIncluded) {
      console.log('FILTERING OUT CAR (reserve_price <= 0):', {
        id: car.id,
        make: car.make,
        model: car.model,
        reserve_price: car.reserve_price
      });
    }
    return isIncluded;
  });
  
  if (isDev) {
    console.log('=== DEALER DASHBOARD FILTERING RESULT ===');
    console.log('Total cars before dealer filter:', cars.length);
    console.log('Cars with reserve_price > 0:', filteredCars.length);
    console.log('Cars filtered out (reserve_price <= 0):', cars.length - filteredCars.length);
    console.log('Final filtered cars:', filteredCars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      reserve_price: car.reserve_price
    })));
  }
  
  return filteredCars;
};

// Process car listings from database - include all cars with valid reserve prices
export const processCarListings = (rawData: any[], applyDealerFilter: boolean = false): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== RAW DATA PROCESSING START ===');
    console.log('Raw data count:', rawData.length);
    console.log('Apply dealer filter:', applyDealerFilter);
    console.log('Sample raw item:', rawData[0]);
    console.log('All raw items summary:', rawData.map((item, index) => ({
      index,
      id: item?.id,
      make: item?.make,
      model: item?.model,
      reserve_price: item?.reserve_price,
      reserve_price_type: typeof item?.reserve_price,
      status: item?.status
    })));
  }
  
  const validCars = rawData.filter((item, index) => {
    const isValid = isValidCarListing(item);
    if (isDev) {
      console.log(`Car ${index + 1} validation result:`, {
        id: item?.id,
        make: item?.make,
        model: item?.model,
        isValid,
        reserve_price: item?.reserve_price
      });
    }
    return isValid;
  });
  
  if (isDev) {
    console.log('=== VALIDATION FILTERING RESULTS ===');
    console.log('Total raw cars:', rawData.length);
    console.log('Valid cars after validation:', validCars.length);
    console.log('Cars filtered out by validation:', rawData.length - validCars.length);
    console.log('Valid cars summary:', validCars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      reserve_price: car.reserve_price
    })));
  }
  
  // Apply dealer-specific filter if requested
  if (applyDealerFilter) {
    const finalResult = filterCarsForDealerDashboard(validCars);
    if (isDev) {
      console.log('=== FINAL PROCESSING RESULT ===');
      console.log('Cars after dealer filtering:', finalResult.length);
    }
    return finalResult;
  }
  
  if (isDev) {
    console.log('=== FINAL PROCESSING RESULT (NO DEALER FILTER) ===');
    console.log('Cars returned without dealer filtering:', validCars.length);
  }
  
  return validCars;
};

// Calculate pagination info
export const calculatePagination = (currentPage: number, pageSize: number, total?: number) => {
  const canGoNext = total ? currentPage * pageSize < total : false;
  const canGoBack = currentPage > 1;
  
  return { canGoNext, canGoBack };
};
