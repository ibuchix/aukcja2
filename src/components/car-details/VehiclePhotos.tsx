
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { getAllCarImages, getImageCount } from "@/utils/imageUtils";

interface VehiclePhotosProps {
  car: CarListing;
}

export const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  const allImages = getAllCarImages(car);
  const imageCount = getImageCount(car);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (allImages.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No photos available for this vehicle</p>
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
        <img
          src={allImages[0]?.src}
          alt={allImages[0]?.label || "Vehicle photo"}
          className="w-full h-64 object-cover rounded-lg cursor-pointer"
          onClick={() => setIsGalleryOpen(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
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
            <img
              key={index}
              src={image.src}
              alt={image.label}
              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedImageIndex(index + 1);
                setIsGalleryOpen(true);
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
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

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={allImages[selectedImageIndex]?.src}
              alt={allImages[selectedImageIndex]?.label || "Vehicle photo"}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
            
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
