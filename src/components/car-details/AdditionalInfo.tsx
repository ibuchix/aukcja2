
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";

interface AdditionalInfoProps {
  car: CarListing;
}

const AdditionalInfo = ({ car }: AdditionalInfoProps) => {
  // Use the camelCase property name
  if (!car.sellerNotes) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Info className="w-5 h-5" />
        Additional Information
      </h3>
      <p className="text-subtitle-text">{car.sellerNotes}</p>
    </div>
  );
};

export default AdditionalInfo;
