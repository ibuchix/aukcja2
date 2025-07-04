
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SimpleBidManager } from "@/components/auction/SimpleBidManager";
import { BidCountDisplay } from "@/components/auction/BidCountDisplay";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { formatCurrency } from "@/lib/utils";

interface LiveAuctionDetailsDialogProps {
  car: any;
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
  const isLive = car.auctionTimingStatus === 'running' || car.auctionTimingStatus === 'unknown';
  const hasEnded = car.auctionTimingStatus === 'ended';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {car.year} {car.make} {car.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Car Details */}
          <div className="space-y-4">
            <div className="aspect-video relative">
              <img 
                src={Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : '/placeholder.svg'}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={isLive ? "default" : hasEnded ? "secondary" : "outline"}>
                  {isLive ? "Live" : hasEnded ? "Ended" : "Scheduled"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Year</p>
                <p className="font-medium">{car.year}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mileage</p>
                <p className="font-medium">{car.mileage?.toLocaleString()} miles</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transmission</p>
                <p className="font-medium">{car.transmission}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fuel Type</p>
                <p className="font-medium">{car.fuel_type || car.fuelType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{car.address || 'Not specified'}</p>
              </div>
            </div>

            {car.seller_notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Seller Notes</p>
                <p className="text-sm">{car.seller_notes}</p>
              </div>
            )}
          </div>

          {/* Auction Details */}
          <div className="space-y-4">
            {/* Bid Count Display */}
            {isLive && !hasEnded && (
              <BidCountDisplay carId={car.id} />
            )}

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Auction Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Reserve Price:</span>
                  <span className="font-medium">{formatCurrency(car.reservePrice || car.reserve_price || 0)}</span>
                </div>
                {car.current_bid > 0 && (
                  <div className="flex justify-between">
                    <span>Current Bid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(car.current_bid)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Time Remaining:</span>
                  <span className="font-medium">
                    {car.scheduleEndTime && !hasEnded ? (
                      <AuctionTimer 
                        auctionEndTime={car.scheduleEndTime} 
                        auctionTimingStatus={car.auctionTimingStatus || 'running'} 
                      />
                    ) : hasEnded ? (
                      'Auction ended'
                    ) : (
                      'Time not available'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Bidding Section */}
            {isLive && !hasEnded && isVerified && (
              <SimpleBidManager
                carId={car.id}
                dealerId={dealerId}
                currentHighestBid={car.current_bid || 0}
                minimumIncrement={1} // Allow any increment above current bid
                reservePrice={car.reservePrice || car.reserve_price}
                isVerified={isVerified}
              />
            )}

            {/* Show verification message if not verified */}
            {isLive && !hasEnded && !isVerified && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">
                  Bidding is only available to verified dealers. Please complete your dealer verification to access this feature.
                </p>
              </div>
            )}

            {hasEnded && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Auction Ended</h3>
                {car.auction_status === 'sold' ? (
                  <p className="text-green-600 font-medium">Vehicle Sold</p>
                ) : (
                  <p className="text-gray-600">No successful sale</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
