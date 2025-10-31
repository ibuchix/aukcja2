import { MapPin } from "lucide-react";
import { CarListing } from "@/types/cars";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface LocationProps {
  car: CarListing;
}

const Location = ({ car }: LocationProps) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
    <h3 className="text-lg font-semibold font-kanit flex items-center gap-2">
      <MapPin className="w-5 h-5" />
      {translateSpecificationLabel('Location')}
    </h3>
    <p className="text-subtitle-text mb-4">
      {car.address || "Location not specified"}
    </p>
   
  </div>
);

export default Location;