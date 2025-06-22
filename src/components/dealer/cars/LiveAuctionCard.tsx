
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";

interface LiveAuctionCardProps {
  car: any;
  dealerId: string;
}

export const LiveAuctionCard: React.FC<LiveAuctionCardProps> = ({ car }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (images: string[] | string) => {
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return '/placeholder.svg';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <span>Auction ending soon</span>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reserve Price</span>
              <span className="font-semibold text-lg">
                {formatPrice(car.reserve_price)}
              </span>
            </div>
            
            {car.current_bid && (
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
