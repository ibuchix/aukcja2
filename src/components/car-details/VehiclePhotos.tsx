
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Camera, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Volume2, VolumeX, Play } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface VehiclePhotosProps {
  car: CarListing;
  showHeader?: boolean;
}

// Helper to detect video files
const isVideoFile = (fileType?: string): boolean => {
  return fileType?.startsWith('video/') || false;
};

export const VehiclePhotos = ({ car, showHeader = true }: VehiclePhotosProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [videoVolume, setVideoVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const isMobile = useIsMobile();
  
  // Get images directly from car data
  const allImages = getAllCarImages(car);
  const imageCount = allImages.length;

  // Sync carousel with selected index
  useEffect(() => {
    if (!carouselApi) return;
    
    carouselApi.on("select", () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Sync volume to all video elements
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = isMuted ? 0 : videoVolume;
        video.muted = isMuted;
      }
    });
  }, [videoVolume, isMuted]);

  const handleImageError = (src: string) => {
    setImageLoadErrors(prev => new Set([...prev, src]));
  };

  const isImageBroken = (src: string) => {
    return imageLoadErrors.has(src);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] / 100;
    setVideoVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setVideoRef = (index: number, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs.current.set(index, element);
      element.volume = isMuted ? 0 : videoVolume;
      element.muted = isMuted;
    } else {
      videoRefs.current.delete(index);
    }
  };

  // Check if current item in gallery is a video
  const currentItemIsVideo = allImages[selectedImageIndex] && isVideoFile(allImages[selectedImageIndex].fileType);

  if (allImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak zdjęć</p>
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
          isVideoFile(allImages[0]?.fileType) ? (
            <div 
              className="relative w-full h-64 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              <video
                src={allImages[0]?.src}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : (
            <img
              src={allImages[0]?.src}
              alt={allImages[0]?.label || "Vehicle photo"}
              className="w-full h-64 object-cover rounded-lg cursor-pointer image-render-quality"
              onClick={() => setIsGalleryOpen(true)}
              onError={() => handleImageError(allImages[0]?.src)}
              decoding="async"
            />
          )
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
                isVideoFile(image.fileType) ? (
                  <div 
                    className="relative w-full h-16 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setSelectedImageIndex(index + 1);
                      setIsGalleryOpen(true);
                    }}
                  >
                    <video
                      src={image.src}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.src}
                    alt={image.label}
                    className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity image-render-quality"
                    onClick={() => {
                      setSelectedImageIndex(index + 1);
                      setIsGalleryOpen(true);
                    }}
                    onError={() => handleImageError(image.src)}
                    decoding="async"
                  />
                )
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
        <DialogContent className={cn(
          "max-w-6xl w-full p-0",
          isMobile ? "h-screen" : "h-[90vh]"
        )}>
          <DialogTitle className="sr-only">Galeria zdjęć pojazdu</DialogTitle>
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
              <CarouselContent className={isMobile ? "h-screen" : "h-[90vh]"}>
                {allImages.map((image, index) => (
                  <CarouselItem key={index} className={cn(
                    "flex items-center justify-center",
                    isMobile ? "p-2" : "p-4"
                  )}>
                    {!isImageBroken(image.src) ? (
                    isVideoFile(image.fileType) ? (
                        // Video player with complete event isolation to prevent carousel from intercepting controls
                        <div 
                          className="relative w-full h-full flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerMove={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseMove={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                        >
                          <video
                            ref={(el) => setVideoRef(index, el)}
                            src={image.src}
                            className="max-w-full max-h-full object-contain"
                            controls
                            playsInline
                            style={{ 
                              width: 'auto', 
                              height: 'auto',
                              maxHeight: '100%',
                              maxWidth: '100%'
                            }}
                          />
                        </div>
                      ) : (
                        // Image with zoom controls
                        <TransformWrapper
                          key={`transform-${index}`}
                          initialScale={1}
                          minScale={0.5}
                          maxScale={4}
                          doubleClick={{ mode: "toggle" }}
                          pinch={{ step: 5 }}
                          wheel={{ step: 0.1 }}
                        >
                          {({ zoomIn, zoomOut, resetTransform }) => (
                            <div className="relative w-full h-full">
                              {/* Zoom Controls - Desktop Only */}
                              {!isMobile && (
                                <div className="absolute top-4 right-4 flex gap-2 z-30">
                                  <Button
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      zoomIn();
                                    }}
                                    aria-label="Zoom in"
                                  >
                                    <ZoomIn className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      zoomOut();
                                    }}
                                    aria-label="Zoom out"
                                  >
                                    <ZoomOut className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resetTransform();
                                    }}
                                    aria-label="Reset zoom"
                                  >
                                    <RotateCcw className="h-5 w-5" />
                                  </Button>
                                </div>
                              )}

                              <TransformComponent
                                wrapperClass="!w-full !h-full"
                                contentStyle={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "100%",
                                  height: "100%",
                                }}
                              >
                                <img
                                  src={image.src}
                                  alt={image.label || `Vehicle photo ${index + 1}`}
                                  className="max-w-full max-h-full object-contain image-render-quality"
                                  style={{ 
                                    width: 'auto', 
                                    height: 'auto',
                                    margin: '0 auto',
                                    display: 'block'
                                  }}
                                  onError={() => handleImageError(image.src)}
                                  decoding="async"
                                />
                              </TransformComponent>
                            </div>
                          )}
                        </TransformWrapper>
                      )
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
                    className={cn(
                      "absolute bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full border-0 z-10",
                      isMobile ? "left-2 w-12 h-12" : "left-4 w-14 h-14"
                    )}
                  />
                  <CarouselNext 
                    className={cn(
                      "absolute bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full border-0 z-10",
                      isMobile ? "right-2 w-12 h-12" : "right-4 w-14 h-14"
                    )}
                  />
                </>
              )}
            </Carousel>

            {/* Volume Control for Videos */}
            {currentItemIsVideo && (
              <div className={cn(
                "absolute left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 z-20",
                isMobile ? "bottom-14" : "bottom-16"
              )}>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || videoVolume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : videoVolume * 100]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
                <span className="text-white text-xs min-w-[2rem] text-right">
                  {isMuted ? 0 : Math.round(videoVolume * 100)}%
                </span>
              </div>
            )}

            {/* Image counter */}
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded z-20",
              isMobile ? "bottom-2 text-sm" : "bottom-4 text-base"
            )}>
              {isVideoFile(allImages[selectedImageIndex]?.fileType) ? 'Wideo' : 'Zdjęcie'} {selectedImageIndex + 1} z {allImages.length}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
