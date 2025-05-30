
import { CarListing } from "@/types/cars";

// Type guard focusing on essential fields only
export const isValidCarListing = (item: any): item is CarListing => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== VALIDATING CAR LISTING ===');
    console.log('Item structure:', {
      id: item?.id,
      make: item?.make,
      model: item?.model,
      reserve_price: item?.reserve_price,
      reservePrice: item?.reservePrice,
      mileage: item?.mileage,
      hasError: 'error' in item
    });
  }
  
  // Check for error objects first
  if (!item || typeof item !== 'object' || 'error' in item) {
    if (isDev) console.log('Invalid: Error object or not object');
    return false;
  }
  
  // Essential field validation - check both snake_case and camelCase
  const hasId = typeof item.id === 'string' && item.id.length > 0;
  const hasReservePrice = (typeof item.reserve_price === 'number' && item.reserve_price > 0) ||
                         (typeof item.reservePrice === 'number' && item.reservePrice > 0);
  const hasMileage = typeof item.mileage === 'number' && item.mileage >= 0;
  
  const isValid = hasId && hasReservePrice && hasMileage;
  
  if (isDev) {
    console.log('Validation result:', {
      hasId,
      hasReservePrice,
      hasMileage,
      isValid
    });
  }
  
  return isValid;
};

// Transform database response to match frontend expectations
export const transformCarData = (rawCar: any): CarListing => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== TRANSFORMING CAR DATA ===');
    console.log('Raw car:', rawCar);
  }
  
  const transformed: CarListing = {
    id: rawCar.id,
    make: rawCar.make,
    model: rawCar.model,
    year: rawCar.year,
    mileage: rawCar.mileage || 0,
    // Handle both snake_case and camelCase for reserve price
    reservePrice: rawCar.reservePrice || rawCar.reserve_price || 0,
    images: rawCar.images,
    requiredPhotos: rawCar.requiredPhotos || rawCar.required_photos,
    
    // Optional fields with transformation
    title: rawCar.title,
    features: rawCar.features,
    transmission: rawCar.transmission,
    isAuction: rawCar.isAuction || rawCar.is_auction,
    auctionEndTime: rawCar.auctionEndTime || rawCar.auction_end_time,
    minimumBidIncrement: rawCar.minimumBidIncrement || rawCar.minimum_bid_increment,
    auctionStatus: rawCar.auctionStatus || rawCar.auction_status,
    isDamaged: rawCar.isDamaged || rawCar.is_damaged,
    address: rawCar.address,
    createdAt: rawCar.createdAt || rawCar.created_at,
    updatedAt: rawCar.updatedAt || rawCar.updated_at,
    status: rawCar.status,
    currentBid: rawCar.currentBid || rawCar.current_bid,
    sellerNotes: rawCar.sellerNotes || rawCar.seller_notes,
    serviceHistoryType: rawCar.serviceHistoryType || rawCar.service_history_type,
    hasServiceHistory: rawCar.hasServiceHistory || rawCar.has_service_history,
    sellerId: rawCar.sellerId || rawCar.seller_id,
    sellerName: rawCar.sellerName || rawCar.seller_name,
    mobileNumber: rawCar.mobileNumber || rawCar.mobile_number,
    additionalPhotos: rawCar.additionalPhotos || rawCar.additional_photos,
    vin: rawCar.vin,
    seatMaterial: rawCar.seatMaterial || rawCar.seat_material,
    numberOfKeys: rawCar.numberOfKeys || rawCar.number_of_keys,
    isRegisteredInPoland: rawCar.isRegisteredInPoland || rawCar.is_registered_in_poland,
    hasPrivatePlate: rawCar.hasPrivatePlate || rawCar.has_private_plate,
    financeAmount: rawCar.financeAmount || rawCar.finance_amount,
    formMetadata: rawCar.formMetadata || rawCar.form_metadata,
    valuationData: rawCar.valuationData || rawCar.valuation_data,
    lastSaved: rawCar.lastSaved || rawCar.last_saved,
    registrationNumber: rawCar.registrationNumber || rawCar.registration_number,
    isManuallyControlled: rawCar.isManuallyControlled || rawCar.is_manually_controlled
  };
  
  if (isDev) {
    console.log('Transformed car:', {
      id: transformed.id,
      make: transformed.make,
      model: transformed.model,
      reservePrice: transformed.reservePrice
    });
  }
  
  return transformed;
};

// Filter cars specifically for dealer dashboard - only cars with reserve_price > 0
export const filterCarsForDealerDashboard = (cars: CarListing[]): CarListing[] => {
  return cars.filter(car => car.reservePrice > 0);
};

// Process car listings from database with proper transformation
export const processCarListings = (rawData: any[], applyDealerFilter: boolean = false): CarListing[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== PROCESSING CARS ===');
    console.log('Raw data count:', rawData.length);
    console.log('Apply dealer filter:', applyDealerFilter);
    
    // Log first car's structure for debugging
    if (rawData.length > 0) {
      console.log('First raw car:', rawData[0]);
    }
  }
  
  // Transform all raw data first
  const transformedCars = rawData.map(transformCarData);
  
  if (isDev) {
    console.log('Transformed cars count:', transformedCars.length);
    if (transformedCars.length > 0) {
      console.log('First transformed car:', transformedCars[0]);
    }
  }
  
  // Filter valid cars
  const validCars = transformedCars.filter(item => {
    const isValid = isValidCarListing(item);
    if (isDev && !isValid) {
      console.log('Invalid car filtered out:', {
        id: item?.id,
        make: item?.make,
        model: item?.model,
        reservePrice: item?.reservePrice
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
