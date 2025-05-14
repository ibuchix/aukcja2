
import { Database } from "@/integrations/supabase/types";
import { CarListing, CarFeatures } from "@/types/cars";
import { isSelectQueryError, safeProcessCarData } from "./supabaseHelpers";

type CarRow = Database["public"]["Tables"]["cars"]["Row"];

/**
 * Safely transforms database car rows to CarListing objects
 * with proper error handling
 */
export function processCarData(data: any[] | { error: any } | null): CarListing[] {
  return safeProcessCarData<CarRow, CarListing>(
    data,
    (car: CarRow) => {
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
        // Default features already set at initialization
      }
      
      // Extract required_photos safely
      let requiredPhotos: Record<string, string | null> | null = null;
      if (car.required_photos && typeof car.required_photos === 'object') {
        requiredPhotos = car.required_photos as Record<string, string | null>;
      }
      
      // Create the car listing with all properties explicitly declared
      return {
        id: car.id,
        title: car.title || null,
        price: car.price || 0,
        make: car.make || null,
        model: car.model || null,
        year: car.year || null,
        mileage: car.mileage || 0,
        images: car.images || null,
        features: parsedFeatures,
        transmission: car.transmission || null,
        required_photos: requiredPhotos,
        
        // Fix for TypeScript errors - add optional properties with proper type handling
        description: (car as any).description || null,
        service_history_files: (car as any).service_history_files || null,
        is_auction: Boolean((car as any).is_auction),
        auction_end_time: (car as any).auction_end_time || null,
        auction_start_time: (car as any).auction_start_time || null,
        reserve_price: (car as any).reserve_price || null,
        minimum_bid_increment: (car as any).minimum_bid_increment || null,
        auction_status: (car as any).auction_status || null,
        is_damaged: Boolean((car as any).is_damaged),
        address: (car as any).address || null,
        condition_rating: (car as any).condition_rating !== undefined ? (car as any).condition_rating : undefined,
        distance: (car as any).distance || null,
        created_at: car.created_at,
        updated_at: (car as any).updated_at || car.created_at,
        status: car.status || null,
        is_draft: Boolean(car.is_draft),
        current_bid: car.current_bid || 0
      };
    }
  );
}

/**
 * Checks if the query result is an array of valid cars (not an error)
 */
export function isValidCarQueryResult(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && !isSelectQueryError(data[0]);
}
