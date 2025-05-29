
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";

interface BasicSpecificationsProps {
  car: CarListing;
}

const BasicSpecifications = ({ car }: BasicSpecificationsProps) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('BasicSpecifications - Reserve price analysis:', {
      carId: car.id,
      make: car.make,
      model: car.model,
      reservePrice: car.reserve_price,
      reservePriceType: typeof car.reserve_price,
      reservePriceIsNumber: typeof car.reserve_price === 'number',
      reservePriceValue: car.reserve_price,
      fullCarData: car
    });
  }

  // Determine reserve price display
  const getReservePriceDisplay = () => {
    if (car.reserve_price !== null && car.reserve_price !== undefined && typeof car.reserve_price === 'number') {
      return formatCurrency(car.reserve_price);
    }
    return "Reserve price not set";
  };

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
          <p className={`font-medium ${car.reserve_price !== null && car.reserve_price !== undefined ? 'text-primary' : 'text-gray-500'}`}>
            {getReservePriceDisplay()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicSpecifications;
