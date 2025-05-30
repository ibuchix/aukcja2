
import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";

interface VehiclePhotosProps {
  car: CarListing;
}

const VehiclePhotos = ({ car }: VehiclePhotosProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("gallery");

  // Get all available images
  const galleryImages = car.images || [];
  const requiredPhotos = car.requiredPhotos || {};

  // Create categories based on available data
  const categories = [
    { id: "gallery", label: "Gallery", images: galleryImages },
    ...(Object.keys(requiredPhotos).length > 0 
      ? [{ id: "required", label: "Required Photos", images: Object.values(requiredPhotos).filter(Boolean) }]
      : []
    )
  ].filter(category => category.images.length > 0);

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const currentImages = currentCategory?.images || [];

  if (categories.length === 0) {
    return (
      <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
        <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Vehicle Photos
        </h3>
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p>No photos available for this vehicle</p>
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  return (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Vehicle Photos
      </h3>

      {/* Category selector */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(category.id);
                setCurrentImageIndex(0);
              }}
            >
              {category.label} ({category.images.length})
            </Button>
          ))}
        </div>
      )}

      {/* Main image display */}
      {currentImages.length > 0 && (
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded-lg">
            <img
              src={currentImages[currentImageIndex]}
              alt={`${car.year} ${car.make} ${car.model} - Photo ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>

          {/* Navigation arrows */}
          {currentImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {currentImages.length}
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {currentImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentImageIndex
                  ? "border-primary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo count info */}
      <div className="text-sm text-gray-600">
        Showing {currentImages.length} photo{currentImages.length !== 1 ? 's' : ''} 
        {currentCategory && ` in ${currentCategory.label}`}
      </div>
    </div>
  );
};

export default VehiclePhotos;
