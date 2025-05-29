
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";

interface BasicSpecificationsProps {
  car: CarListing;
}

const BasicSpecifications = ({ car }: BasicSpecificationsProps) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('=== BASIC SPECIFICATIONS COMPONENT ===');
    console.log('Car data received:', {
      carId: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      reservePrice: car.reserve_price,
      reservePriceType: typeof car.reserve_price,
      reservePriceIsNull: car.reserve_price === null,
      reservePriceIsUndefined: car.reserve_price === undefined,
      reservePriceIsNumber: typeof car.reserve_price === 'number',
      reservePriceValue: car.reserve_price,
      allCarData: car
    });
  }

  // Determine reserve price display with explicit checks
  const getReservePriceDisplay = () => {
    if (isDev) {
      console.log('Reserve price evaluation:', {
        value: car.reserve_price,
        type: typeof car.reserve_price,
        isNull: car.reserve_price === null,
        isUndefined: car.reserve_price === undefined,
        isNumber: typeof car.reserve_price === 'number',
        isGreaterThanZero: typeof car.reserve_price === 'number' && car.reserve_price > 0
      });
    }
    
    if (typeof car.reserve_price === 'number' && car.reserve_price > 0) {
      const formatted = formatCurrency(car.reserve_price);
      if (isDev) {
        console.log('Formatting reserve price:', car.reserve_price, '→', formatted);
      }
      return formatted;
    }
    return "Reserve price not set";
  };

  const reservePriceDisplay = getReservePriceDisplay();
  const hasReservePrice = typeof car.reserve_price === 'number' && car.reserve_price > 0;

  if (isDev) {
    console.log('Final reserve price display:', {
      display: reservePriceDisplay,
      hasReservePrice,
      originalValue: car.reserve_price
    });
  }

  return (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Info className="w-5 h-5" />
        Basic Specifications
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-subtitle-text">Make</p>
          <p className="font-medium">{car.make || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Model</p>
          <p className="font-medium">{car.model || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Year</p>
          <p className="font-medium">{car.year || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Mileage</p>
          <p className="font-medium">{car.mileage?.toLocaleString() || "N/A"} km</p>
        </div>
        <div>
          <p className="text-subtitle-text">Transmission</p>
          <p className="font-medium">{car.transmission || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Reserve Price</p>
          <p className={`font-medium ${hasReservePrice ? 'text-primary' : 'text-gray-500'}`}>
            {reservePriceDisplay}
          </p>
        </div>
      </div>
      
      {isDev && (
        <div className="mt-4 p-2 bg-yellow-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Reserve Price Raw: {JSON.stringify(car.reserve_price)}</p>
          <p>Reserve Price Type: {typeof car.reserve_price}</p>
          <p>Has Reserve Price: {hasReservePrice.toString()}</p>
          <p>Display: {reservePriceDisplay}</p>
        </div>
      )}
    </div>
  );
};

export default BasicSpecifications;
