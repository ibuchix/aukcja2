
import { Database } from "@/integrations/supabase/types";
import { CarListing, CarFeatures } from "@/types/cars";
import { isSelectQueryError, safeProcessCarData } from "./supabaseHelpers";

type CarRow = Database["public"]["Tables"]["cars"]["Row"];

/**
 * Extract reserve price from valuation data
 */
function extractReservePriceFromValuation(valuation_data: any): number | null {
  if (!valuation_data) return null;
  
  // Try different possible paths for reserve price
  if (valuation_data.reservePrice) return Number(valuation_data.reservePrice);
  if (valuation_data.reserve_price) return Number(valuation_data.reserve_price);
  if (valuation_data.basePrice) {
    // Calculate reserve price as 80% of base price if no explicit reserve price
    return Math.round(Number(valuation_data.basePrice) * 0.8);
  }
  
  return null;
}

/**
 * Extract price from valuation data
 */
function extractPriceFromValuation(valuation_data: any, fallbackPrice: number): number {
  if (!valuation_data) return fallbackPrice;
  
  // Try different possible paths for price
  if (valuation_data.basePrice) return Number(valuation_data.basePrice);
  if (valuation_data.price) return Number(valuation_data.price);
  if (valuation_data.estimatedValue) return Number(valuation_data.estimatedValue);
  
  return fallbackPrice;
}

/**
 * Process image URLs to handle blob URLs and make them accessible
 */
function processImageUrl(url: string | null): string | null {
  if (!url) return null;
  
  // If it's already a regular URL (not blob), return as is
  if (!url.startsWith('blob:')) {
    return url;
  }
  
  return url;
}

/**
 * Safely transforms database car rows to CarListing objects
 * with proper error handling and reserve price preservation
 */
export function processCarData(data: any[] | { error: any } | null): CarListing[] {
  return safeProcessCarData<CarRow, CarListing>(
    data,
    (car: CarRow) => {
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        console.log('=== PROCESSING CAR DATA ===');
        console.log('Car raw data:', {
          id: car.id,
          make: car.make,
          model: car.model,
          reserve_price: car.reserve_price,
          reserve_price_type: typeof car.reserve_price,
          valuation_data: car.valuation_data
        });
      }
      
      // Create default features object
      let parsedFeatures: CarFeatures = {
        satNav: false,
        heatedSeats: false,
        panoramicRoof: false,
        reverseCamera: false,
        upgradedSound: false
      };
      
      // Parse the features object safely
      try {
        if (typeof car.features === 'string') {
          const featuresObj = JSON.parse(car.features);
          parsedFeatures = {
            satNav: Boolean(featuresObj?.satNav),
            heatedSeats: Boolean(featuresObj?.heatedSeats),
            panoramicRoof: Boolean(featuresObj?.panoramicRoof),
            reverseCamera: Boolean(featuresObj?.reverseCamera),
            upgradedSound: Boolean(featuresObj?.upgradedSound)
          };
        } else if (car.features && typeof car.features === 'object') {
          const featuresObj = car.features as Record<string, any>;
          parsedFeatures = {
            satNav: Boolean(featuresObj?.satNav),
            heatedSeats: Boolean(featuresObj?.heatedSeats),
            panoramicRoof: Boolean(featuresObj?.panoramicRoof),
            reverseCamera: Boolean(featuresObj?.reverseCamera),
            upgradedSound: Boolean(featuresObj?.upgradedSound)
          };
        }
      } catch (e) {
        console.error("Error parsing features:", e);
      }
      
      // Extract required_photos safely and process image URLs
      let requiredPhotos: Record<string, string | null> | null = null;
      if (car.required_photos && typeof car.required_photos === 'object') {
        const rawPhotos = car.required_photos as Record<string, any>;
        requiredPhotos = {};
        Object.keys(rawPhotos).forEach(key => {
          requiredPhotos![key] = processImageUrl(rawPhotos[key]);
        });
      }

      // Process images array
      let processedImages: string[] | null = null;
      if (car.images && Array.isArray(car.images)) {
        processedImages = car.images
          .map(img => processImageUrl(img))
          .filter((img): img is string => img !== null);
      }

      // Extract price from valuation data if car price is 0
      let finalPrice = car.price || 0;
      if (finalPrice === 0 && car.valuation_data) {
        finalPrice = extractPriceFromValuation(car.valuation_data, 0);
      }

      // CRITICAL: Preserve reserve price from database
      let finalReservePrice = car.reserve_price;
      
      // Only extract from valuation data if reserve_price is null/undefined
      if (finalReservePrice === null || finalReservePrice === undefined) {
        if (car.valuation_data) {
          finalReservePrice = extractReservePriceFromValuation(car.valuation_data);
        }
      }
      
      if (isDev) {
        console.log('Reserve price processing:', {
          original: car.reserve_price,
          final: finalReservePrice,
          type: typeof finalReservePrice,
          fromValuation: finalReservePrice !== car.reserve_price
        });
      }
      
      // Create the car listing with all properties explicitly declared
      const carListing: CarListing = {
        id: car.id,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        price: finalPrice,
        make: car.make || null,
        model: car.model || null,
        year: car.year || null,
        mileage: car.mileage || 0,
        images: processedImages,
        features: parsedFeatures,
        transmission: car.transmission || null,
        required_photos: requiredPhotos,
        
        // Fix for TypeScript errors - add optional properties with proper type handling
        description: (car as any).description || null,
        service_history_files: (car as any).service_history_files || null,
        is_auction: Boolean((car as any).is_auction),
        auction_end_time: (car as any).auction_end_time || null,
        auction_start_time: (car as any).auction_start_time || null,
        reserve_price: finalReservePrice, // Ensure this is preserved
        minimum_bid_increment: (car as any).minimum_bid_increment || null,
        auction_status: (car as any).auction_status || null,
        is_damaged: Boolean((car as any).is_damaged),
        address: (car as any).address || null,
        condition_rating: (car as any).condition_rating !== undefined ? (car as any).condition_rating : undefined,
        distance: (car as any).distance || null,
        created_at: car.created_at,
        updated_at: (car as any).updated_at || car.created_at,
        status: car.status || null,
        current_bid: car.current_bid || 0
      };
      
      if (isDev) {
        console.log('Final car listing:', {
          id: carListing.id,
          reserve_price: carListing.reserve_price,
          reserve_price_type: typeof carListing.reserve_price
        });
      }
      
      return carListing;
    }
  );
}

/**
 * Checks if the query result is an array of valid cars (not an error)
 */
export function isValidCarQueryResult(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && !isSelectQueryError(data[0]);
}
