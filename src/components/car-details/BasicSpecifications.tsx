
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
      reservePrice: car.reservePrice,
      reservePriceType: typeof car.reservePrice,
      isValidReservePrice: typeof car.reservePrice === 'number' && !isNaN(car.reservePrice) && car.reservePrice > 0
    });
  }

  // Determine reserve price display with explicit checks
  const getReservePriceDisplay = () => {
    if (isDev) {
      console.log('Reserve price evaluation:', {
        value: car.reservePrice,
        type: typeof car.reservePrice,
        isNumber: typeof car.reservePrice === 'number',
        isGreaterThanZero: typeof car.reservePrice === 'number' && car.reservePrice > 0,
        isNaN: typeof car.reservePrice === 'number' && isNaN(car.reservePrice)
      });
    }
    
    // Check for valid numeric reserve price
    if (typeof car.reservePrice === 'number' && !isNaN(car.reservePrice) && car.reservePrice > 0) {
      const formatted = formatCurrency(car.reservePrice);
      if (isDev) {
        console.log('Formatting reserve price:', car.reservePrice, '→', formatted);
      }
      return formatted;
    }
    return "Reserve price not set";
  };

  const reservePriceDisplay = getReservePriceDisplay();
  const hasReservePrice = typeof car.reservePrice === 'number' && !isNaN(car.reservePrice) && car.reservePrice > 0;

  if (isDev) {
    console.log('Final reserve price display:', {
      display: reservePriceDisplay,
      hasReservePrice,
      originalValue: car.reservePrice
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
          <p className={`font-medium ${hasReservePrice ? 'text-primary font-bold' : 'text-gray-500'}`}>
            {reservePriceDisplay}
          </p>
          {isDev && (
            <p className="text-xs text-blue-600 mt-1">
              Debug: {car.reservePrice} ({typeof car.reservePrice})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicSpecifications;
