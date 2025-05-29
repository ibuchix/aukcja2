
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";

interface BasicSpecificationsProps {
  car: CarListing;
}

const BasicSpecifications = ({ car }: BasicSpecificationsProps) => (
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
        <p className="font-medium">{car.mileage.toLocaleString()} km</p>
      </div>
      <div>
        <p className="text-subtitle-text">Transmission</p>
        <p className="font-medium">{car.transmission || "N/A"}</p>
      </div>
      <div>
        <p className="text-subtitle-text">Reserve Price</p>
        <p className="font-medium text-primary">
          {car.reserve_price ? formatCurrency(car.reserve_price) : "Reserve price not disclosed"}
        </p>
      </div>
    </div>
  </div>
);

export default BasicSpecifications;
