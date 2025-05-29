
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
          valuation_data: car.valuation_data,
          required_photos: car.required_photos
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

      // CRITICAL: Preserve reserve price from database - ensure it's a number
      let finalReservePrice: number | null = null;
      
      // First, check if we have a direct numeric reserve price
      if (typeof car.reserve_price === 'number' && !isNaN(car.reserve_price) && car.reserve_price > 0) {
        finalReservePrice = car.reserve_price;
        if (isDev) {
          console.log('Using direct reserve price:', finalReservePrice);
        }
      } else if (car.valuation_data) {
        // Try to extract from valuation data
        const extractedPrice = extractReservePriceFromValuation(car.valuation_data);
        if (typeof extractedPrice === 'number' && !isNaN(extractedPrice) && extractedPrice > 0) {
          finalReservePrice = extractedPrice;
          if (isDev) {
            console.log('Using extracted reserve price from valuation:', finalReservePrice);
          }
        }
      }
      
      if (isDev) {
        console.log('Reserve price processing result:', {
          original: car.reserve_price,
          original_type: typeof car.reserve_price,
          final: finalReservePrice,
          final_type: typeof finalReservePrice,
          isValidNumber: typeof finalReservePrice === 'number' && !isNaN(finalReservePrice) && finalReservePrice > 0
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
        
        // Add required properties for CarListing type
        is_auction: Boolean(car.is_auction),
        auction_end_time: car.auction_end_time || null,
        reserve_price: finalReservePrice, // This should now properly preserve numeric values
        minimum_bid_increment: (car as any).minimum_bid_increment || null,
        auction_status: car.auction_status || null,
        is_damaged: Boolean(car.is_damaged),
        address: (car as any).address || null,
        condition_rating: (car as any).condition_rating !== undefined ? (car as any).condition_rating : undefined,
        distance: (car as any).distance || null,
        created_at: car.created_at,
        updated_at: car.updated_at || car.created_at,
        status: car.status || null,
        current_bid: car.current_bid || 0
      };
      
      if (isDev) {
        console.log('Final car listing reserve price check:', {
          id: carListing.id,
          make: carListing.make,
          model: carListing.model,
          reserve_price: carListing.reserve_price,
          reserve_price_type: typeof carListing.reserve_price,
          isValidReservePrice: typeof carListing.reserve_price === 'number' && !isNaN(carListing.reserve_price) && carListing.reserve_price > 0
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
