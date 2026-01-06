
import { CarListing } from "@/types/cars";
import { calculateAuctionTimingStatus } from "@/components/dealer/auction/hooks/utils/auctionTimingUtils";

// Helper function to generate title from valuation data
const generateTitleFromValuationData = (valuationData: any): string | null => {
  if (!valuationData || typeof valuationData !== 'object') {
    return null;
  }
  
  const year = valuationData.year;
  const make = valuationData.make;
  const model = valuationData.model;
  
  // Only generate title if we have at least make and model
  if (make && model) {
    const parts = [year, make, model].filter(Boolean);
    return parts.join(' ').trim();
  }
  
  return null;
};

// Helper function to check if title is generic/meaningless
const isGenericTitle = (title: string | null | undefined): boolean => {
  if (!title || typeof title !== 'string') {
    return true;
  }
  
  const genericTitles = ['Car Listing', 'car listing', 'Car', 'Vehicle', 'Auto'];
  return genericTitles.includes(title.trim());
};

export const processCarData = (rawData: any[]): CarListing[] => {
  return rawData
    .filter(item => item && typeof item === 'object')
    .map(car => {
      // Extract schedule information if available
      const scheduleInfo = car.auction_schedules ? 
        (Array.isArray(car.auction_schedules) ? car.auction_schedules[0] : car.auction_schedules) : 
        null;
      
      // Calculate auction timing status if schedule data is available
      const auctionTimingStatus = scheduleInfo ? 
        calculateAuctionTimingStatus(
          scheduleInfo.start_time,
          scheduleInfo.end_time,
          scheduleInfo.status
        ) : 'unknown';

      // Debug logging for specific car (Nikola 456)
      if (car.id === 'b02af546-886a-4811-888e-080b618be747') {
        console.log('🔍 [CAR DATA TRANSFORMATION] Nikola 456:', {
          raw_is_damaged: car.is_damaged,
          raw_is_registered_in_poland: car.is_registered_in_poland,
          raw_has_full_registration_document: car.has_full_registration_document,
          typeof_is_damaged: typeof car.is_damaged,
          typeof_is_registered_in_poland: typeof car.is_registered_in_poland,
          typeof_has_full_registration_document: typeof car.has_full_registration_document
        });
      }

      // Generate proper title - prioritize valuation data if stored title is generic
      let finalTitle = car.title || '';
      
      if (isGenericTitle(finalTitle)) {
        // Try to get title from valuation data first
        const valuationTitle = generateTitleFromValuationData(car.valuation_data);
        if (valuationTitle) {
          finalTitle = valuationTitle;
        } else {
          // Fallback to generating from car fields
          finalTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim();
        }
      }
      
      // Ensure we have some title
      if (!finalTitle) {
        finalTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim() || 'Vehicle';
      }

      // FIX: The database 'price' field IS the reserve price - map it correctly
      const reservePrice = car.price || car.reserve_price || 0;

      return {
        id: car.id,
        make: car.make || 'Unknown',
        model: car.model || 'Unknown',
        year: car.year || 0,
        mileage: car.mileage || 0,
        price: reservePrice, // Map to the reserve price for backwards compatibility
        reservePrice: reservePrice, // This is the main field components should use
        currentBid: car.current_bid || 0,
        images: car.images || [],
        requiredPhotos: car.required_photos || {},
        additionalPhotos: car.additional_photos || [],
        transmission: car.transmission || 'Unknown',
        fuelType: car.fuel_type || '',
        features: car.features || {},
        isAuction: car.is_auction || false,
        auctionEndTime: car.auction_end_time || '',
        minimumBidIncrement: car.minimum_bid_increment || 100,
        auctionStatus: car.auction_status || 'inactive',
        isDamaged: car.is_damaged ?? false,
        address: car.address || '',
        town: car.town || '',
        county: car.county || '',
        sellerNotes: car.seller_notes || '',
        serviceHistoryType: car.service_history_type || '',
        hasServiceHistory: car.has_service_history || false,
        sellerId: car.seller_id || '',
        sellerName: car.seller_name || '',
        mobileNumber: car.mobile_number || '',
        vin: car.vin || '',
        seatMaterial: car.seat_material || '',
        numberOfKeys: car.number_of_keys || 1,
        isRegisteredInPoland: car.is_registered_in_poland ?? false,
        hasFullRegistrationDocument: car.has_full_registration_document ?? false,
        hasPrivatePlate: car.has_private_plate ?? false,
        financeAmount: car.finance_amount || 0,
        formMetadata: car.form_metadata || {},
        valuationData: car.valuation_data || {},
        lastSaved: car.last_saved || '',
        registrationNumber: car.registration_number || '',
        isManuallyControlled: car.is_manually_controlled || false,
        title: finalTitle,
        // Auction schedule fields
        scheduleStatus: scheduleInfo?.status,
        scheduleStartTime: scheduleInfo?.start_time,
        scheduleEndTime: scheduleInfo?.end_time,
        auctionTimingStatus: auctionTimingStatus,
        // Preserve file uploads if they exist from carsQueryBuilder
        fileUploads: car.fileUploads || [],
        
        // Body/Interior Condition fields
        hasScratches: car.has_scratches ?? null,
        hasDents: car.has_dents ?? null,
        hasRust: car.has_rust ?? null,
        hasInteriorStains: car.has_interior_stains ?? null,
        
        // Mechanical/Systems Condition fields
        engineSmokes: car.engine_smokes ?? null,
        engineFaults: car.engine_faults ?? null,
        gearboxFaults: car.gearbox_faults ?? null,
        brakesNoisy: car.brakes_noisy ?? null,
        suspensionNoisy: car.suspension_noisy ?? null,
        electricalFaults: car.electrical_faults ?? null,
        warningLightsOn: car.warning_lights_on ?? null,
        acWorking: car.ac_working ?? null,
        windowsWorking: car.windows_working ?? null,
        runsSmoothly: car.runs_smoothly ?? null,
        tiresLegalDepth: car.tires_legal_depth ?? null,
        
        // Vehicle History fields
        isPolishOrigin: car.is_polish_origin ?? null,
        isDamagedRecordPoland: car.is_damaged_record_poland ?? null,
        isDamagedRecordAbroad: car.is_damaged_record_abroad ?? null,
        isAccidentRecordPoland: car.is_accident_record_poland ?? null,
        isAccidentRecordAbroad: car.is_accident_record_abroad ?? null,
        hasMileageDiscrepancy: car.has_mileage_discrepancy ?? null,
        isRecordedStolen: car.is_recorded_stolen ?? null,
        ownersCountPoland: car.owners_count_poland ?? null,
        technicalInspectionValidUntil: car.technical_inspection_valid_until ?? null
      } as CarListing;
    });
};
