
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Key, FileText, AlertCircle, CheckCircle, Wrench, Zap, Heart } from "lucide-react";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { PhotoBadge } from "./PhotoBadge";
import { AuctionStatusIndicator } from "./AuctionStatusIndicator";
import { getPrimaryImage, getAllCarImages } from "@/utils/imageUtils";
import { useImagePrefetch } from "@/hooks/useImagePrefetch";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateFuelType } from "@/lib/fuelTypeUtils";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface LiveAuctionCardProps {
  car: any;
  dealerId: string;
  onClick: (car: any) => void;
}

export const LiveAuctionCard: React.FC<LiveAuctionCardProps> = ({ car, dealerId, onClick }) => {
  const { prefetchImages } = useImagePrefetch();
  const isMobile = useIsMobile();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const formatPrice = (price: number | null | undefined) => {
    // Handle null, undefined, or NaN values
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'Cena niedostępna';
    }
    
    const numPrice = Number(price);
    if (numPrice === 0) {
      return 'Bez ceny minimalnej';
    }
    
    // Format as PLN currency (Polish Zloty)
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };


  // Get auction end time from schedule data
  const auctionEndTime = car.auctionEndTime;
  const auctionStartTime = car.scheduleStartTime;

  // Use the correctly mapped reservePrice field from the processed data
  const reservePrice = car.reservePrice || car.reserve_price || car.price || 0;

  // Enhanced auction status logic with better timing calculation
  const getAuctionDisplayStatus = () => {
    const now = new Date();
    
    // If we have timing data, use it for accurate status
    if (auctionStartTime && auctionEndTime) {
      const startTime = new Date(auctionStartTime);
      const endTime = new Date(auctionEndTime);
      
      if (now > endTime) {
        return { status: 'ended', label: 'Aukcja zakończona' };
      }
      
      if (now >= startTime && now <= endTime) {
        return { status: 'live', label: 'Aukcja na żywo' };
      }
      
      if (now < startTime) {
        const timeUntilStart = startTime.getTime() - now.getTime();
        const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60));
        
        if (hoursUntilStart <= 1) {
          return { status: 'starting-soon', label: 'Wkrótce rozpocznie się' };
        }
        return { status: 'scheduled', label: `Rozpocznie się za ${hoursUntilStart}h` };
      }
    }
    
    // Fallback: check car's auction_status or provided timing status
    if (car.auctionTimingStatus) {
      switch (car.auctionTimingStatus) {
        case 'active':
          return { status: 'live', label: 'Aukcja na żywo' };
        case 'scheduled':
          return { status: 'scheduled', label: 'Zaplanowana' };
        case 'ended':
          return { status: 'ended', label: 'Aukcja zakończona' };
        default:
          // If we have an end time but status is unknown, calculate from time
          if (auctionEndTime) {
            const endTime = new Date(auctionEndTime);
            if (now <= endTime) {
              return { status: 'live', label: 'Aukcja na żywo' };
            } else {
              return { status: 'ended', label: 'Aukcja zakończona' };
            }
          }
          return { status: 'unknown', label: 'Status nieznany' };
      }
    }
    
    // Final fallback
    return { status: 'unknown', label: 'Status nieznany' };
  };

  const displayStatus = getAuctionDisplayStatus();
  const isLive = displayStatus.status === 'live';
  const isStartingSoon = displayStatus.status === 'starting-soon';
  const hasEnded = displayStatus.status === 'ended';

  // Map display status to timer status
  const getTimerStatus = (): 'scheduled' | 'active' | 'ended' | 'unknown' => {
    switch (displayStatus.status) {
      case 'live':
        return 'active';
      case 'starting-soon':
      case 'scheduled':
        return 'scheduled';
      case 'ended':
        return 'ended';
      default:
        // If we have timing data but status is unknown, determine from time
        if (auctionEndTime) {
          const now = new Date();
          const endTime = new Date(auctionEndTime);
          return now <= endTime ? 'active' : 'ended';
        }
        return 'unknown';
    }
  };

  const handleCardHover = () => {
    // Prefetch all car images when user hovers over card
    const allImages = getAllCarImages(car);
    if (allImages.length > 0) {
      const imageUrls = allImages
        .map(img => img.src)
        .filter(url => url && url !== '/placeholder.svg');
      if (imageUrls.length > 0) {
        prefetchImages(imageUrls);
      }
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(car.id);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onClick(car)}
      onMouseEnter={handleCardHover}
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={getPrimaryImage(car)} 
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
          loading="lazy"
          onLoad={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          style={{ opacity: 0 }}
        />
        
        {/* Top-left: Live Status Badge */}
        {isLive && (
          <PhotoBadge variant="live" position="top-left">
            Aukcja na żywo
          </PhotoBadge>
        )}
        
        {/* Top-right: Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur shadow-lg hover:bg-background transition-all hover:scale-110 z-10"
          aria-label={isInWishlist(car.id) ? "Usuń z listy życzeń" : "Dodaj do listy życzeń"}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              isInWishlist(car.id) 
                ? "fill-destructive text-destructive" 
                : "text-muted-foreground hover:text-destructive"
            )}
          />
        </button>
        
        {/* Damage Badge */}
        {car.isDamaged && (
          <PhotoBadge variant="damaged" position="top-right" className="mr-16">
            Uszkodzony
          </PhotoBadge>
        )}
        
        {/* Bottom-left: Registration or Verified Seller */}
        {car.isRegisteredInPoland ? (
          <PhotoBadge variant="registered" position="bottom-left">
            Zarejestrowany w Polsce
          </PhotoBadge>
        ) : (
          <PhotoBadge variant="verified-seller" position="bottom-left">
            Zweryfikowany prywatny sprzedający
          </PhotoBadge>
        )}
        
        {/* Bottom-right: Payment on Collection (always show) */}
        <PhotoBadge variant="payment-collection" position="bottom-right">
          Płatność przy odbiorze
        </PhotoBadge>
      </div>
      
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Title and Timer */}
          <div className="flex items-start justify-between gap-3">
            <h3 className={`font-kanit font-semibold ${isMobile ? 'text-base' : 'text-lg'} flex-1`}>
              {car.year} {car.make} {car.model}
            </h3>
            {isLive && auctionEndTime && (
              <div className="flex-shrink-0">
                <AuctionTimer auctionEndTime={auctionEndTime} />
              </div>
            )}
          </div>
          
          {/* Key Specs */}
          <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground flex-wrap`}>
            <span>{car.mileage?.toLocaleString()} km</span>
            <span>•</span>
            <span>{translateTransmission(car.transmission)}</span>
            {car.fuelType && (
              <>
                <span>•</span>
                <span className="text-[#D81B24] font-semibold">{translateFuelType(car.fuelType)}</span>
              </>
            )}
          </div>
          
          {/* Location */}
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>
              {car.town && car.county 
                ? `${car.town}, ${car.county}` 
                : car.town || car.county || 'Lokalizacja nie podana'}
            </span>
          </div>

          {/* Seller Notes - Prominent position */}
          {car.sellerNotes && (
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} bg-accent/30 border border-accent/50 p-3 rounded-md`}>
              <p className="text-muted-foreground font-semibold mb-1.5">Uwagi sprzedającego:</p>
              <p className="text-foreground leading-relaxed">
                {car.sellerNotes.length > (isMobile ? 100 : 150) 
                  ? `${car.sellerNotes.substring(0, isMobile ? 100 : 150)}...` 
                  : car.sellerNotes}
              </p>
            </div>
          )}

          {/* Vehicle Details Section */}
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1.5 pt-2 border-t`}>
            {car.vin && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">VIN:</span>
                <span className="font-mono">{car.vin}</span>
              </div>
            )}
            {car.registration_number && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rejestracja:</span>
                <span className="font-semibold">{car.registration_number}</span>
              </div>
            )}
            {car.number_of_keys && (
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{car.number_of_keys} {car.number_of_keys === 1 ? 'klucz' : 'kluczy'}</span>
              </div>
            )}
            {car.seat_material && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tapicerka:</span>
                <span>{car.seat_material}</span>
              </div>
            )}
          </div>

          {/* Instant Purchase Badge */}
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} bg-emerald-50 dark:bg-emerald-950 p-2 rounded-md border border-emerald-200 dark:border-emerald-800`}>
            <Zap className="h-4 w-4 text-amber-500 drop-shadow-[0_0_6px_rgba(251,146,60,0.7)] flex-shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              Możliwość Natychmiastowego zakupu
            </span>
          </div>

          {/* Service History */}
          {(car.has_service_history || car.service_history_type) && (
            <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} bg-green-50 dark:bg-green-950 p-2 rounded-md`}>
              <Wrench className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-400">
                {car.service_history_type || 'Historia serwisowa dostępna'}
              </span>
              {car.has_service_history && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
          )}

          {/* Important Warnings */}
          {car.has_outstanding_finance && (
            <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} bg-amber-50 dark:bg-amber-950 p-2 rounded-md`}>
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">
                Niespłacone finansowanie: {formatPrice(car.finance_amount)}
              </span>
            </div>
          )}
          
          {car.has_full_registration_document && (
            <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-400">Pełna dokumentacja rejestracyjna</span>
            </div>
          )}
          
          {/* Pricing Section */}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {translateSpecificationLabel('Reserve Price')}
              </span>
              <span className={`font-kanit font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                {formatPrice(reservePrice)}
              </span>
            </div>
            
            {car.current_bid && car.current_bid > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Aktualna oferta
                </span>
                <span className={`font-kanit font-semibold ${hasEnded ? 'text-gray-600' : 'text-green-600'} ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {formatPrice(car.current_bid)}
                </span>
              </div>
            )}
            
            {hasEnded && car.auction_status === 'sold' && (
              <div className="flex justify-between items-center mt-1">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-600`}>
                  Wynik końcowy
                </span>
                <span className="font-kanit font-semibold text-green-600">SPRZEDANY</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
