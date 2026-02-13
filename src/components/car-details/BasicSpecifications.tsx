
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateSpecificationLabel, translateFuelType } from "@/lib/vehicleTranslations";

interface BasicSpecificationsProps {
  car: CarListing;
}

const BasicSpecifications = ({ car }: BasicSpecificationsProps) => {
  return (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-kanit flex items-center gap-2">
        <Info className="w-5 h-5" />
        {translateSpecificationLabel('Basic Specifications')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Make')}</p>
          <p className="font-medium">{car.make || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Model')}</p>
          <p className="font-medium">{car.model || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Year')}</p>
          <p className="font-medium">{car.year || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Mileage')}</p>
          <p className="font-medium">{car.mileage?.toLocaleString() || "N/A"} km</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Transmission')}</p>
          <p className="font-medium">{translateTransmission(car.transmission)}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Fuel Type')}</p>
          <p className="font-medium">{translateFuelType(car.fuel_type || car.fuelType)}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('Horsepower')}</p>
          <p className="font-medium">{car.horsepower ? `${car.horsepower} KM` : "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">{translateSpecificationLabel('VIN Number')}</p>
          <p className="font-medium">{car.vin || "Not available"}</p>
        </div>
      </div>
    </div>
  );
};

export default BasicSpecifications;
