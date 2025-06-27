
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gauge, MapPin, Clock, Car } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import { AuctionTimer } from "@/components/auction/AuctionTimer";

interface LiveAuctionDetailsDialogProps {
  car: any | null;
  dealerId: string;
  isVerified: boolean;
  onClose: () => void;
}

export const LiveAuctionDetailsDialog = ({ 
  car, 
  dealerId, 
  isVerified, 
  onClose 
}: LiveAuctionDetailsDialogProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!car) return null;

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'Not available';
    }
    
    const numPrice = Number(price);
    if (numPrice === 0) {
      return 'No reserve';
    }
    
    return formatCurrency(numPrice);
  };

  // Get auction end time from schedule data or fallback
  const auctionEndTime = car.schedule_end_time || car.auction_end_time;
  const auctionStartTime = car.schedule_start_time;

  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {car.year} {car.make} {car.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              {car.images && car.images.length > 0 ? (
                <img
                  src={car.images[selectedImageIndex] || car.images[0]}
                  alt={car.title || `${car.year} ${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Car className="w-16 h-16" />
                </div>
              )}
            </div>
            
            {car.images && car.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {car.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${car.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-6">
            {/* Status and Price */}
            <div className="flex items-center justify-between">
              <Badge className="bg-green-600">
                Live Auction
              </Badge>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(car.current_bid || car.reserve_price)}
                </div>
                <div className="text-sm text-gray-500">
                  {car.current_bid && car.current_bid > 0 ? "Current Bid" : "Reserve Price"}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-400" />
                <span>{car.mileage?.toLocaleString()} miles</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-gray-400" />
                <span className="capitalize">{car.transmission}</span>
              </div>
              {car.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="truncate">{car.address}</span>
                </div>
              )}
            </div>

            {/* Auction Timing */}
            {(auctionStartTime || auctionEndTime) && (
              <div className="space-y-2">
                <h3 className="font-semibold">Auction Schedule</h3>
                <div className="space-y-1 text-sm">
                  {auctionStartTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Started: {new Date(auctionStartTime).toLocaleString()}</span>
                    </div>
                  )}
                  {auctionEndTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <AuctionTimer 
                        auctionEndTime={auctionEndTime} 
                        auctionTimingStatus={car.auctionTimingStatus || 'running'} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            {car.features && typeof car.features === 'object' && Object.keys(car.features).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(car.features).map(([key, value]) => (
                    <Badge key={key} variant="outline">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bidding Interface */}
        <div className="mt-6 pt-6 border-t">
          <MaxBidInterface
            carId={car.id}
            dealerId={dealerId}
            currentHighestBid={car.current_bid || 0}
            minimumIncrement={car.minimum_bid_increment || 100}
            auctionEndTime={auctionEndTime || car.auction_end_time}
            reservePrice={car.reserve_price}
            isVerified={isVerified}
            scheduleStatus={car.schedule_status}
            scheduleStartTime={auctionStartTime}
            scheduleEndTime={auctionEndTime}
            auctionTimingStatus={car.auctionTimingStatus || 'running'}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
