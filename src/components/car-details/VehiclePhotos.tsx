
import { Camera, ImageOff, AlertCircle } from "lucide-react";
import { CarListing } from "@/types/cars";
import { useState } from "react";

interface VehiclePhotosProps {
  car: CarListing;
}

const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

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

  const handleImageError = (src: string) => {
    console.warn(`Failed to load image: ${src}`);
    setImageErrors(prev => new Set([...prev, src]));
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(src);
      return newSet;
    });
  };

  const handleImageLoad = (src: string) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(src);
      return newSet;
    });
  };

  const handleImageLoadStart = (src: string) => {
    setImageLoading(prev => new Set([...prev, src]));
  };

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
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                {imageErrors.has(image.src) ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-xs text-center">Failed to load image</p>
                  </div>
                ) : (
                  <>
                    {imageLoading.has(image.src) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                    <img
                      src={image.src}
                      alt={image.label}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(image.src)}
                      onLoad={() => handleImageLoad(image.src)}
                      onLoadStart={() => handleImageLoadStart(image.src)}
                    />
                  </>
                )}
              </div>
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
