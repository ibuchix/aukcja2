
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { AuctionStatusIndicator } from "./AuctionStatusIndicator";
import { getPrimaryImage } from "@/utils/imageUtils";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface LiveAuctionCardProps {
  car: any;
  dealerId: string;
  onClick: (car: any) => void;
}

export const LiveAuctionCard: React.FC<LiveAuctionCardProps> = ({ car, dealerId, onClick }) => {
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

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onClick(car)}
    >
      <div className="aspect-video relative">
        <img 
          src={getPrimaryImage(car)} 
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <AuctionStatusIndicator
            auctionTimingStatus={car.auctionTimingStatus || getTimerStatus()}
            scheduleStartTime={car.scheduleStartTime}
            scheduleEndTime={car.scheduleEndTime}
            auctionStatus={car.auction_status}
          />
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">
            {car.year} {car.make} {car.model}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{car.mileage?.toLocaleString()} km</span>
            <span>{translateTransmission(car.transmission)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {car.town && car.county 
                ? `${car.town}, ${car.county}` 
                : car.town || car.county || 'Lokalizacja nie podana'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {auctionEndTime && !hasEnded ? (
              <AuctionTimer 
                auctionEndTime={auctionEndTime} 
              />
            ) : hasEnded ? (
              <span>Aukcja zakończona</span>
            ) : auctionEndTime ? (
              // Show countdown even if status calculation failed
              <AuctionTimer 
                auctionEndTime={auctionEndTime} 
              />
            ) : (
              <span>{displayStatus.label}</span>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{translateSpecificationLabel('Reserve Price')}</span>
              <span className="font-semibold text-lg">
                {formatPrice(reservePrice)}
              </span>
            </div>
            
            {car.current_bid && car.current_bid > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Aktualna oferta</span>
                <span className={`font-semibold ${hasEnded ? 'text-gray-600' : 'text-green-600'}`}>
                  {formatPrice(car.current_bid)}
                </span>
              </div>
            )}
            
            {hasEnded && car.auction_status === 'sold' && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium text-green-600">Wynik końcowy</span>
                <span className="font-semibold text-green-600">SPRZEDANY</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
