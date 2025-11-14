
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Camera, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { CarListing } from "@/types/cars";
import { getAllCarImages, getImageCount, debugCarImages } from "@/utils/imageUtils";
import { useCarImagesFallback } from "@/hooks/useCarImagesFallback";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface VehiclePhotosProps {
  car: CarListing;
  showHeader?: boolean;
}

export const VehiclePhotos = ({ car, showHeader = true }: VehiclePhotosProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
  const { 
    getAllImagesWithFallback, 
    getTotalImageCount, 
    isLoadingStorage 
  } = useCarImagesFallback(car);
  
  // Get images with fallback support
  const dbImages = getAllCarImages(car);
  const fallbackImages = getAllImagesWithFallback();
  const allImages = dbImages.length > 0 ? dbImages : (fallbackImages || []);
  const imageCount = getTotalImageCount();

  // Sync carousel with selected index
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.on("select", () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleImageError = (src: string) => {
    setImageLoadErrors(prev => new Set([...prev, src]));
  };

  const isImageBroken = (src: string) => {
    return imageLoadErrors.has(src);
  };

  if (isLoadingStorage) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading vehicle photos...</p>
        </div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No photos available for this vehicle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Zdjęcia Pojazdu</h3>
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Camera className="h-4 w-4" />
            {imageCount} photo{imageCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
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
            {translateSpecificationLabel('View All')} {imageCount}
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

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full bg-black">
            <Carousel 
              className="w-full h-full"
              setApi={setCarouselApi}
              opts={{
                align: "center",
                loop: true,
                startIndex: selectedImageIndex
              }}
            >
              <CarouselContent className="h-[80vh]">
                {allImages.map((image, index) => (
                  <CarouselItem key={index} className="flex items-center justify-center p-4">
                    {!isImageBroken(image.src) ? (
                      <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={4}
                        doubleClick={{ mode: "toggle" }}
                        pinch={{ step: 5 }}
                        wheel={{ step: 0.1 }}
                      >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                          <>
                            {/* Zoom Controls */}
                            <div className="absolute top-4 right-4 flex gap-2 z-30">
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                onClick={() => zoomIn()}
                                aria-label="Zoom in"
                              >
                                <ZoomIn className="h-5 w-5" />
                              </Button>
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                onClick={() => zoomOut()}
                                aria-label="Zoom out"
                              >
                                <ZoomOut className="h-5 w-5" />
                              </Button>
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                onClick={() => resetTransform()}
                                aria-label="Reset zoom"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </Button>
                            </div>

                            <TransformComponent
                              wrapperStyle={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={image.src}
                                alt={image.label || `Vehicle photo ${index + 1}`}
                                className="max-w-full max-h-full object-contain"
                                style={{ width: 'auto', height: 'auto' }}
                                onError={() => handleImageError(image.src)}
                              />
                            </TransformComponent>
                          </>
                        )}
                      </TransformWrapper>
                    ) : (
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Image failed to load</p>
                        <p className="text-sm opacity-75 mt-2">
                          {image.label}
                        </p>
                      </div>
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Big Red Navigation Buttons */}
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious 
                    className="absolute left-4 bg-primary hover:bg-primary/90 text-white shadow-lg w-14 h-14 rounded-full border-0 z-10"
                  />
                  <CarouselNext 
                    className="absolute right-4 bg-primary hover:bg-primary/90 text-white shadow-lg w-14 h-14 rounded-full border-0 z-10"
                  />
                </>
              )}
            </Carousel>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded z-20">
              Zdjęcie {selectedImageIndex + 1} z {allImages.length}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
