import { Camera } from "lucide-react";
import { CarListing } from "@/types/cars";

interface VehiclePhotosProps {
  car: CarListing;
}

const VehiclePhotos = ({ car }: VehiclePhotosProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
      <Camera className="w-5 h-5" />
      Vehicle Photos
    </h3>
    <div className="grid grid-cols-2 gap-4">
      {car.required_photos &&
        Object.entries(car.required_photos).map(
          ([key, value]) =>
            value && (
              <div key={key} className="space-y-2">
                <img
                  src={value}
                  alt={`${key.replace(/_/g, " ").toUpperCase()}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-sm text-subtitle-text text-center">
                  {key.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
            )
        )}
    </div>
  </div>
);

export default VehiclePhotos;