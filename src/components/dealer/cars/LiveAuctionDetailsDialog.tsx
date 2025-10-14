
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SimpleBidManager } from "@/components/auction/SimpleBidManager";
import { BidCountDisplay } from "@/components/auction/BidCountDisplay";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { VehiclePhotos } from "@/components/car-details/VehiclePhotos";
import { formatCurrency } from "@/lib/utils";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateSpecificationLabel, translateVehicleFeature, translateFuelType, translateSeatMaterial } from "@/lib/vehicleTranslations";

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
  const isLive = car.auctionTimingStatus === 'active' || car.auctionTimingStatus === 'unknown';
  const hasEnded = car.auctionTimingStatus === 'ended';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {car.year} {car.make} {car.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Car Details - Takes up 2 columns on xl screens */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Zdjęcia Pojazdu</h3>
              <Badge variant={isLive ? "default" : hasEnded ? "secondary" : "outline"} className="text-sm px-3 py-1">
                {isLive ? "Aukcja na żywo" : hasEnded ? "Zakończona" : "Zaplanowana"}
              </Badge>
            </div>
            <VehiclePhotos car={car} showHeader={false} />
            
            {/* Vehicle Specifications */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-body-text">{translateSpecificationLabel('Vehicle Specifications')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Year')}</span>
                      <span className="font-semibold text-lg text-body-text">{car.year}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Mileage')}</span>
                      <span className="font-semibold text-lg text-body-text">{car.mileage?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Transmission')}</span>
                      <span className="font-semibold text-lg text-body-text">{translateTransmission(car.transmission)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Fuel Type')}</span>
                      <span className="font-semibold text-lg capitalize text-body-text">{translateFuelType(car.fuel_type || car.fuelType)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('VIN')}</span>
                      <span className="font-semibold font-mono text-sm break-all text-body-text">{car.vin || translateSpecificationLabel('Not available')}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Number of Keys')}</span>
                      <span className="font-semibold text-lg text-body-text">{(car.numberOfKeys || car.number_of_keys) || translateSpecificationLabel('Not specified')}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">{translateSpecificationLabel('Seat Material')}</span>
                      <span className="font-semibold text-lg capitalize text-body-text">{translateSeatMaterial(car.seat_material || car.seatMaterial)}</span>
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
                    <h4 className="text-xl font-semibold mb-4 text-body-text">{translateSpecificationLabel('Vehicle Features')}</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/30">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-sm font-medium text-body-text">{translateVehicleFeature(feature)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Service History */}
              {(car.service_history_type || car.has_service_history) && (
                <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                  <h4 className="font-medium text-base mb-3 text-body-text">{translateSpecificationLabel('Service History')}</h4>
                  <div className="text-sm space-y-2">
                    {car.service_history_type && (
                      <p><span className="text-subtitle-text">Type:</span> <span className="font-medium text-body-text">{car.service_history_type}</span></p>
                    )}
                    {car.has_service_history && (
                      <p className="text-green-600 font-medium">✓ Service history documentation available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Condition */}
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                <h4 className="font-medium text-base mb-3 text-body-text">{translateSpecificationLabel('Vehicle Condition')}</h4>
                <div className="text-sm space-y-2">
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Damaged')}:</span> <span className="font-medium text-body-text">{car.is_damaged ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Registered in Poland')}:</span> <span className="font-medium text-body-text">{(car.isRegisteredInPoland || car.is_registered_in_poland) ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Private Plate')}:</span> <span className="font-medium text-body-text">{car.has_private_plate ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  {car.finance_amount && (
                    <p><span className="text-subtitle-text">Finance Outstanding:</span> <span className="font-medium text-body-text">{formatCurrency(car.finance_amount)}</span></p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-base mb-3">{translateSpecificationLabel('Location')}</h4>
                <p className="text-sm font-medium">
                  {car.town && car.county 
                    ? `${car.town}, ${car.county}` 
                    : car.town || car.county || translateSpecificationLabel('Location not specified')}
                </p>
              </div>

              {/* Seller Contact */}
              {car.seller_name && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Seller Information</h4>
                  <div className="text-sm space-y-2">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{car.seller_name}</span></p>
                    {car.mobile_number && (
                      <p><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{car.mobile_number}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Seller Notes */}
              {car.seller_notes && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Seller Notes</h4>
                  <p className="text-sm leading-relaxed">{car.seller_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Auction Details - Takes up 1 column on xl screens */}
          <div className="xl:col-span-1 space-y-6">
            {/* Bid Count Display */}
            {isLive && !hasEnded && (
              <BidCountDisplay carId={car.id} />
            )}

            <div className="p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Status licytacji</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Cena orientacyjna:</span>
                  <span className="font-bold text-lg">{formatCurrency(car.reservePrice || car.reserve_price || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Pozostały czas:</span>
                  <span className="font-medium">
                    <AuctionTimer 
                      auctionEndTime={car.auctionEndTime} 
                    />
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
                  Licytowanie jest dostępne tylko dla zweryfikowanych dealerów. Ukończ weryfikację dealera, aby uzyskać dostęp do tej funkcji.
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
