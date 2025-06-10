
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
          required_photos: car.required_photos,
          images: car.images,
          images_type: typeof car.images
        });
      }
      
      // Create default features object with boolean properties
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
      
      // Extract required_photos safely - it's already a JSONB object
      let requiredPhotos: Record<string, string | null> | null = null;
      if (car.required_photos && typeof car.required_photos === 'object') {
        const rawPhotos = car.required_photos as Record<string, any>;
        requiredPhotos = {};
        Object.keys(rawPhotos).forEach(key => {
          const processedUrl = processImageUrl(rawPhotos[key]);
          requiredPhotos![key] = processedUrl;
        });
      }

      // Process images array - it's a text[] array from the database
      let processedImages: string[] | null = null;
      if (car.images && Array.isArray(car.images)) {
        processedImages = car.images
          .map(img => processImageUrl(img))
          .filter((img): img is string => img !== null);
      }

      // CRITICAL: Use reserve_price directly from database
      let finalReservePrice: number = car.reserve_price || 0;
      
      if (isDev) {
        console.log('Reserve price processing result:', {
          original: car.reserve_price,
          original_type: typeof car.reserve_price,
          final: finalReservePrice,
          final_type: typeof finalReservePrice,
          isValidNumber: typeof finalReservePrice === 'number' && !isNaN(finalReservePrice) && finalReservePrice > 0
        });
      }
      
      // Create the car listing with all properties explicitly declared using camelCase
      const carListing: CarListing = {
        id: car.id,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        reservePrice: finalReservePrice,
        price: finalReservePrice, // Add the required price property
        make: car.make || '',
        model: car.model || '',
        year: car.year || 0,
        mileage: car.mileage || 0,
        images: processedImages,
        features: parsedFeatures,
        transmission: car.transmission || null,
        requiredPhotos: requiredPhotos,
        
        // Add required properties for CarListing type using camelCase
        isAuction: Boolean(car.is_auction),
        auctionEndTime: car.auction_end_time || null,
        minimumBidIncrement: (car as any).minimum_bid_increment || null,
        auctionStatus: car.auction_status || null,
        isDamaged: Boolean(car.is_damaged),
        address: (car as any).address || null,
        createdAt: car.created_at,
        updatedAt: car.updated_at || car.created_at,
        status: car.status || null,
        currentBid: car.current_bid || 0
      };
      
      if (isDev) {
        console.log('Final car listing reserve price check:', {
          id: carListing.id,
          make: carListing.make,
          model: carListing.model,
          reservePrice: carListing.reservePrice,
          reservePrice_type: typeof carListing.reservePrice,
          isValidReservePrice: typeof carListing.reservePrice === 'number' && !isNaN(carListing.reservePrice) && carListing.reservePrice > 0
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
