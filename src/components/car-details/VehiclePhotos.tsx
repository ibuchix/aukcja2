
import { Camera, ImageOff } from "lucide-react";
import { CarListing } from "@/types/cars";

interface VehiclePhotosProps {
  car: CarListing;
}

const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  // Collect all available images from both required_photos and images array
  const allImages: { src: string; label: string }[] = [];

  // Add images from required_photos
  if (car.required_photos) {
    Object.entries(car.required_photos).forEach(([key, value]) => {
      if (value) {
        allImages.push({
          src: value,
          label: key.replace(/_/g, " ").toUpperCase()
        });
      }
    });
  }

  // Add images from images array
  if (car.images && car.images.length > 0) {
    car.images.forEach((image, index) => {
      allImages.push({
        src: image,
        label: `ADDITIONAL IMAGE ${index + 1}`
      });
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Vehicle Photos ({allImages.length})
      </h3>
      
      {allImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {allImages.map((image, index) => (
            <div key={index} className="space-y-2">
              <img
                src={image.src}
                alt={image.label}
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-sm text-subtitle-text text-center">
                {image.label}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <ImageOff className="w-12 h-12 mb-2" />
          <p className="text-sm">No images available for this vehicle</p>
        </div>
      )}
    </div>
  );
};

export default VehiclePhotos;
