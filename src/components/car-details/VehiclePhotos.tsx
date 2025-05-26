
import { Camera, ImageOff, AlertCircle } from "lucide-react";
import { CarListing } from "@/types/cars";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/PermissionGate";
import { getAllCarImages } from "@/utils/imageUtils";

interface VehiclePhotosProps {
  car: CarListing;
}

const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

  // Use the unified image utility
  const allImages = getAllCarImages(car);

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
    <PermissionGate action="view" entityType="car" entityId={car.id}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Vehicle Photos ({allImages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                    {imageErrors.has(image.src) ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p className="text-xs text-center px-2">Failed to load image</p>
                      </div>
                    ) : (
                      <>
                        {imageLoading.has(image.src) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        )}
                        <img
                          src={image.src}
                          alt={image.label}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={() => handleImageError(image.src)}
                          onLoad={() => handleImageLoad(image.src)}
                          onLoadStart={() => handleImageLoadStart(image.src)}
                        />
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center font-medium">
                    {image.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageOff className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium mb-2">No images available</p>
              <p className="text-sm text-center">
                Images for this vehicle have not been uploaded yet or are not accessible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PermissionGate>
  );
};

export default VehiclePhotos;
