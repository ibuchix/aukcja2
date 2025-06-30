
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { AuctionStatusIndicator } from "./AuctionStatusIndicator";

interface LiveAuctionCardProps {
  car: any;
  dealerId: string;
  onClick: (car: any) => void;
}

export const LiveAuctionCard: React.FC<LiveAuctionCardProps> = ({ car, dealerId, onClick }) => {
  const formatPrice = (price: number | null | undefined) => {
    // Handle null, undefined, or NaN values
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'Price not available';
    }
    
    const numPrice = Number(price);
    if (numPrice === 0) {
      return 'No reserve';
    }
    
    // Format as PLN currency (Polish Zloty)
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getImageUrl = (images: string[] | string) => {
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return '/placeholder.svg';
  };

  // Get auction end time from schedule data or fallback
  const auctionEndTime = car.schedule_end_time || car.auction_end_time;

  // Use the correctly mapped reservePrice field from the processed data
  const reservePrice = car.reservePrice || car.reserve_price || car.price || 0;

  // Determine if this auction should still be shown as "live"
  const isActuallyLive = car.auctionTimingStatus === 'running';
  const hasEnded = car.auctionTimingStatus === 'ended';

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onClick(car)}
    >
      <div className="aspect-video relative">
        <img 
          src={getImageUrl(car.images)} 
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <AuctionStatusIndicator
            auctionTimingStatus={car.auctionTimingStatus || 'unknown'}
            scheduleStartTime={car.scheduleStartTime}
            scheduleEndTime={car.scheduleEndTime}
            auctionStatus={car.auction_status}
          />
        </div>
        {isActuallyLive && (
          <Badge className="absolute top-2 left-2 bg-red-500">
            Live Auction
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">
            {car.year} {car.make} {car.model}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{car.mileage?.toLocaleString()} miles</span>
            <span>{car.transmission}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{car.address || 'Location not specified'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {auctionEndTime && !hasEnded ? (
              <AuctionTimer 
                auctionEndTime={auctionEndTime} 
                auctionTimingStatus={car.auctionTimingStatus || 'running'} 
              />
            ) : hasEnded ? (
              <span>Auction ended</span>
            ) : (
              <span>Auction ending soon</span>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reserve Price</span>
              <span className="font-semibold text-lg">
                {formatPrice(reservePrice)}
              </span>
            </div>
            
            {car.current_bid && car.current_bid > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Current Bid</span>
                <span className={`font-semibold ${hasEnded ? 'text-gray-600' : 'text-green-600'}`}>
                  {formatPrice(car.current_bid)}
                </span>
              </div>
            )}
            
            {hasEnded && car.auction_status === 'sold' && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium text-green-600">Final Result</span>
                <span className="font-semibold text-green-600">SOLD</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
