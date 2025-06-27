
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { AuctionTimer } from "@/components/auction/AuctionTimer";

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

  // Debug log the car data to understand the pricing issue
  console.log('🏷️ [LIVE AUCTION CARD PRICE DEBUG]', {
    carId: car.id,
    make: car.make,
    model: car.model,
    reserve_price: car.reserve_price,
    current_bid: car.current_bid,
    price: car.price,
    allPriceFields: {
      reserve_price: car.reserve_price,
      current_bid: car.current_bid,
      price: car.price,
      starting_price: car.starting_price
    }
  });

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
        <Badge className="absolute top-2 right-2 bg-red-500">
          Live Auction
        </Badge>
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
            {auctionEndTime ? (
              <AuctionTimer 
                auctionEndTime={auctionEndTime} 
                auctionTimingStatus={car.auctionTimingStatus || 'running'} 
              />
            ) : (
              <span>Auction ending soon</span>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reserve Price</span>
              <span className="font-semibold text-lg">
                {formatPrice(car.reserve_price)}
              </span>
            </div>
            
            {car.current_bid && car.current_bid > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Current Bid</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(car.current_bid)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
