
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { getAllCarImages, getImageCount, debugCarImages } from "@/utils/imageUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VehiclePhotosProps {
  car: CarListing;
}

export const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  
  const allImages = getAllCarImages(car);
  const imageCount = getImageCount(car);

  // Debug images in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      debugCarImages(car);
    }
  }, [car]);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleImageError = (src: string) => {
    setImageLoadErrors(prev => new Set([...prev, src]));
  };

  const isImageBroken = (src: string) => {
    return imageLoadErrors.has(src);
  };

  if (allImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No photos available for this vehicle</p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Debug Info:</strong> Car ID: {car.id}, Images: {JSON.stringify(car.images)}, 
              Required Photos: {JSON.stringify(car.requiredPhotos)}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vehicle Photos</h3>
        <span className="text-sm text-gray-600 flex items-center gap-1">
          <Camera className="h-4 w-4" />
          {imageCount} photo{imageCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Main image */}
      <div className="relative">
        {!isImageBroken(allImages[0]?.src) ? (
          <img
            src={allImages[0]?.src}
            alt={allImages[0]?.label || "Vehicle photo"}
            className="w-full h-64 object-cover rounded-lg cursor-pointer"
            onClick={() => setIsGalleryOpen(true)}
            onError={() => handleImageError(allImages[0]?.src)}
          />
        ) : (
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Image failed to load</p>
            </div>
          </div>
        )}
        
        {allImages.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => setIsGalleryOpen(true)}
          >
            View All {imageCount}
          </Button>
        )}
      </div>

      {/* Thumbnail grid */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.slice(1, 5).map((image, index) => (
            <div key={index} className="relative">
              {!isImageBroken(image.src) ? (
                <img
                  src={image.src}
                  alt={image.label}
                  className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setSelectedImageIndex(index + 1);
                    setIsGalleryOpen(true);
                  }}
                  onError={() => handleImageError(image.src)}
                />
              ) : (
                <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                  <Camera className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {allImages.length > 5 && (
            <div 
              className="w-full h-16 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsGalleryOpen(true)}
            >
              <span className="text-sm text-gray-600">+{allImages.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Debug:</strong> Found {allImages.length} images. 
            Errors: {imageLoadErrors.size}. 
            Car ID: {car.id}
          </AlertDescription>
        </Alert>
      )}

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {!isImageBroken(allImages[selectedImageIndex]?.src) ? (
              <img
                src={allImages[selectedImageIndex]?.src}
                alt={allImages[selectedImageIndex]?.label || "Vehicle photo"}
                className="max-w-full max-h-full object-contain"
                onError={() => handleImageError(allImages[selectedImageIndex]?.src)}
              />
            ) : (
              <div className="text-center text-white">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Image failed to load</p>
                <p className="text-sm opacity-75 mt-2">
                  {allImages[selectedImageIndex]?.label}
                </p>
              </div>
            )}
            
            {/* Navigation buttons */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded">
              {selectedImageIndex + 1} of {allImages.length}
            </div>
            
            {/* Image label */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
              {allImages[selectedImageIndex]?.label}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
