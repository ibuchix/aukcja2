
import { Info } from "lucide-react";
import { CarListing } from "@/types/cars";

interface AdditionalInfoProps {
  car: CarListing;
}

const AdditionalInfo = ({ car }: AdditionalInfoProps) => {
  // Since description doesn't exist in the database, we can use seller_notes instead
  if (!car.seller_notes) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Info className="w-5 h-5" />
        Additional Information
      </h3>
      <p className="text-subtitle-text">{car.seller_notes}</p>
    </div>
  );
};

export default AdditionalInfo;
