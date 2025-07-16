
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
            
            {/* Vehicle Specifications */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vehicle Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Year</span>
                      <span className="font-semibold">{car.year}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Mileage</span>
                      <span className="font-semibold">{car.mileage?.toLocaleString()} miles</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Transmission</span>
                      <span className="font-semibold capitalize">{car.transmission || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Fuel Type</span>
                      <span className="font-semibold capitalize">{car.fuel_type || car.fuelType || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">VIN</span>
                      <span className="font-semibold font-mono text-xs">{car.vin || 'Not available'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Registration</span>
                      <span className="font-semibold">{car.registration_number || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Number of Keys</span>
                      <span className="font-semibold">{car.number_of_keys || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <span className="text-muted-foreground">Seat Material</span>
                      <span className="font-semibold capitalize">{car.seat_material || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Features */}
              {car.features && Object.keys(car.features).length > 0 && (() => {
                // Filter features to only show ones that are true
                const activeFeatures = Object.entries(car.features)
                  .filter(([_, value]) => value === true)
                  .map(([key, _]) => {
                    // Convert camelCase to readable format
                    const readableKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                    return readableKey;
                  });

                if (activeFeatures.length === 0) return null;

                return (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Vehicle Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {activeFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Service History */}
              {(car.service_history_type || car.has_service_history) && (
                <div className="p-3 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Service History</h4>
                  <div className="text-xs space-y-1">
                    {car.service_history_type && (
                      <p><span className="text-muted-foreground">Type:</span> {car.service_history_type}</p>
                    )}
                    {car.has_service_history && (
                      <p className="text-green-600">✓ Service history documentation available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Condition */}
              <div className="p-3 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Vehicle Condition</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-muted-foreground">Damaged:</span> {car.is_damaged ? 'Yes' : 'No'}</p>
                  <p><span className="text-muted-foreground">Registered in Poland:</span> {(car.isRegisteredInPoland || car.is_registered_in_poland) ? 'Yes' : 'No'}</p>
                  <p><span className="text-muted-foreground">Private Plate:</span> {car.has_private_plate ? 'Yes' : 'No'}</p>
                  {car.finance_amount && (
                    <p><span className="text-muted-foreground">Finance Outstanding:</span> {formatCurrency(car.finance_amount)}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-3 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Location</h4>
                <p className="text-sm">{car.address || 'Location not specified'}</p>
              </div>

              {/* Seller Contact */}
              {car.seller_name && (
                <div className="p-3 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Seller Information</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {car.seller_name}</p>
                    {car.mobile_number && (
                      <p><span className="text-muted-foreground">Contact:</span> {car.mobile_number}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Seller Notes */}
              {car.seller_notes && (
                <div className="p-3 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Seller Notes</h4>
                  <p className="text-sm leading-relaxed">{car.seller_notes}</p>
                </div>
              )}
            </div>
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
                    {hasEnded ? (
                      'Auction ended'
                    ) : (
                      <AuctionTimer 
                        auctionEndTime={car.scheduleEndTime || car.auction_end_time} 
                        auctionTimingStatus={car.auctionTimingStatus || 'running'} 
                      />
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
