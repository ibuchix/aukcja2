
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
import { getSignedVideoUrl } from "@/utils/imageUtils/carFileUploads";
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

// Normalize video URL to fix encoding issues with special characters
const normalizeVideoUrl = (url: string): string => {
  if (!url) return '';
  try {
    // Decode first to avoid double-encoding, then re-encode properly
    const decoded = decodeURIComponent(url);
    const urlObj = new URL(decoded);
    // Re-encode only the pathname portion
    urlObj.pathname = urlObj.pathname
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return urlObj.toString();
  } catch {
    return url;
  }
};

export const VehiclePhotos = ({ car, showHeader = true }: VehiclePhotosProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [videoVolume, setVideoVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [videoLoadErrors, setVideoLoadErrors] = useState<Set<number>>(new Set());
  const [videoLoading, setVideoLoading] = useState<Set<number>>(new Set());
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string>('');
  const [videoModalLoading, setVideoModalLoading] = useState(false);
  const [videoModalError, setVideoModalError] = useState(false);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  
  // Get images directly from car data
  const allImages = getAllCarImages(car);
  const imageCount = allImages.length;
  
  // Find walk-around video in the gallery
  const walkaroundVideo = allImages.find(img => 
    img.fileType?.startsWith('video/')
  );
  const walkaroundVideoSrc = walkaroundVideo?.src;

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

  // Open video modal with signed URL generation
  const openVideoModal = async () => {
    if (!walkaroundVideoSrc) return;
    
    setVideoModalOpen(true);
    setVideoModalLoading(true);
    setVideoModalError(false);
    
    try {
      // Generate signed URL for reliable video streaming
      const signedUrl = await getSignedVideoUrl(walkaroundVideoSrc);
      setSignedVideoUrl(signedUrl);
    } catch (error) {
      console.error('Failed to generate signed video URL:', error);
      // Fall back to normalized public URL
      setSignedVideoUrl(normalizeVideoUrl(walkaroundVideoSrc));
    } finally {
      setVideoModalLoading(false);
    }
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
        
        {/* Walk-around Video Quick Access Button */}
        {walkaroundVideo && (
          <Button
            className="absolute bottom-2 left-2 bg-primary hover:bg-primary/90 text-white"
            size="sm"
            onClick={openVideoModal}
          >
            <Play className="h-4 w-4 mr-2" />
            Obejrzyj wideo
          </Button>
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
                          {videoLoadErrors.has(index) ? (
                            <div className="text-center text-white p-4">
                              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="mb-4">Nie udało się załadować wideo</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Retry loading the video
                                  setVideoLoadErrors(prev => {
                                    const next = new Set(prev);
                                    next.delete(index);
                                    return next;
                                  });
                                  setVideoLoading(prev => new Set([...prev, index]));
                                }}
                              >
                                Spróbuj ponownie
                              </Button>
                            </div>
                          ) : (
                            <>
                              <video
                                ref={(el) => setVideoRef(index, el)}
                                className="max-w-full max-h-full object-contain"
                                controls
                                playsInline
                                preload="auto"
                                onLoadStart={() => {
                                  console.log('Video loading started:', image.src);
                                  setVideoLoading(prev => new Set([...prev, index]));
                                }}
                                onCanPlay={() => {
                                  console.log('Video can play:', image.src);
                                  setVideoLoading(prev => {
                                    const next = new Set(prev);
                                    next.delete(index);
                                    return next;
                                  });
                                }}
                                onError={(e) => {
                                  console.error('Video load error:', image.src, e);
                                  setVideoLoadErrors(prev => new Set([...prev, index]));
                                }}
                                style={{ 
                                  width: 'auto', 
                                  height: 'auto',
                                  maxHeight: '100%',
                                  maxWidth: '100%'
                                }}
                              >
                                <source src={image.src} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              {videoLoading.has(index) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                                </div>
                              )}
                            </>
                          )}
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

      {/* Dedicated Video Modal with Signed URL */}
      <Dialog open={videoModalOpen} onOpenChange={(open) => {
        setVideoModalOpen(open);
        if (!open) {
          setSignedVideoUrl('');
          setVideoModalError(false);
        }
      }}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <DialogTitle className="sr-only">Wideo pojazdu</DialogTitle>
          
          {videoModalLoading ? (
            <div className="w-full aspect-video flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : videoModalError ? (
            <div className="w-full aspect-video flex flex-col items-center justify-center text-white">
              <Camera className="h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">Nie udało się załadować wideo</p>
              <Button
                variant="outline"
                onClick={openVideoModal}
              >
                Spróbuj ponownie
              </Button>
            </div>
          ) : signedVideoUrl ? (
            <div className="relative">
              <video
                ref={modalVideoRef}
                className="w-full aspect-video"
                controls
                autoPlay
                playsInline
                preload="auto"
                onError={() => setVideoModalError(true)}
              >
                <source src={signedVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Volume Control Bar */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 z-20">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => {
                    if (modalVideoRef.current) {
                      modalVideoRef.current.muted = !modalVideoRef.current.muted;
                      setIsMuted(modalVideoRef.current.muted);
                    }
                  }}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : videoVolume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(values) => {
                    const newVolume = values[0] / 100;
                    setVideoVolume(newVolume);
                    if (modalVideoRef.current) {
                      modalVideoRef.current.volume = newVolume;
                      modalVideoRef.current.muted = newVolume === 0;
                      setIsMuted(newVolume === 0);
                    }
                  }}
                  className="w-24"
                />
                <span className="text-white text-xs min-w-[2rem] text-right">
                  {isMuted ? 0 : Math.round(videoVolume * 100)}%
                </span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
