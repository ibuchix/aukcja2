
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SimpleBidManager } from "@/components/auction/SimpleBidManager";
import { VehiclePhotos } from "@/components/car-details/VehiclePhotos";
import { formatCurrency } from "@/lib/utils";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateSpecificationLabel, translateVehicleFeature, translateFuelType, translateServiceHistoryType } from "@/lib/vehicleTranslations";

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
  
  // Debug: Log seller_notes to console
  console.log('🔍 [DIALOG CAR DATA]', {
    carId: car.id,
    make: car.make,
    model: car.model,
    sellerNotes: car.sellerNotes,
    hasSellerNotes: !!car.sellerNotes,
    sellerNotesType: typeof car.sellerNotes,
    // Condition fields debugging
    isDamaged: car.isDamaged,
    is_damaged: car.is_damaged,
    isRegisteredInPoland: car.isRegisteredInPoland,
    is_registered_in_poland: car.is_registered_in_poland,
    hasFullRegistrationDocument: car.hasFullRegistrationDocument,
    has_full_registration_document: car.has_full_registration_document,
    allKeys: Object.keys(car)
  });

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
                <h3 className="font-kanit font-semibold text-2xl mb-6 text-body-text border-b border-accent/20 pb-3">
                  {translateSpecificationLabel('Vehicle Specifications')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Primary Specs - Year */}
                  <div className="p-5 bg-background border border-accent/30 rounded-lg hover:border-primary/50 transition-colors">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Year')}
                    </div>
                    <div className="text-2xl font-kanit font-semibold text-body-text">
                      {car.year}
                    </div>
                  </div>
                  
                  {/* Primary Specs - Mileage */}
                  <div className="p-5 bg-background border border-accent/30 rounded-lg hover:border-primary/50 transition-colors">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Mileage')}
                    </div>
                    <div className="text-2xl font-kanit font-semibold text-body-text">
                      {car.mileage?.toLocaleString()} <span className="text-base text-subtitle-text">km</span>
                    </div>
                  </div>
                  
                  {/* Primary Specs - VIN */}
                  <div className="p-5 bg-background border border-accent/30 rounded-lg hover:border-primary/50 transition-colors">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('VIN')}
                    </div>
                    <div className="text-sm font-mono font-kanit font-medium text-body-text break-all">
                      {car.vin || translateSpecificationLabel('Not available')}
                    </div>
                  </div>
                  
                  {/* Secondary Specs - Transmission */}
                  <div className="p-5 bg-background border border-accent/20 rounded-lg">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Transmission')}
                    </div>
                    <div className="text-lg font-kanit font-medium text-body-text">
                      {translateTransmission(car.transmission)}
                    </div>
                  </div>
                  
                  {/* Secondary Specs - Fuel Type */}
                  <div className="p-5 bg-background border border-accent/20 rounded-lg">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Fuel Type')}
                    </div>
                    <div className="text-lg font-kanit font-medium text-body-text capitalize">
                      {translateFuelType(car.fuel_type || car.fuelType)}
                    </div>
                  </div>
                  
                  {/* Secondary Specs - Number of Keys */}
                  <div className="p-5 bg-background border border-accent/20 rounded-lg">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Number of Keys')}
                    </div>
                    <div className="text-lg font-kanit font-medium text-body-text">
                      {(car.numberOfKeys || car.number_of_keys) || translateSpecificationLabel('Not specified')}
                    </div>
                  </div>
                  
                  {/* Secondary Specs - Service History */}
                  <div className="p-5 bg-background border border-accent/20 rounded-lg md:col-span-2 lg:col-span-3">
                    <div className="text-xs text-subtitle-text font-kanit font-light uppercase tracking-wider mb-2">
                      {translateSpecificationLabel('Service History')}
                    </div>
                    <div className="text-lg font-kanit font-medium text-body-text">
                      {(car.service_history_type || car.serviceHistoryType) ? (
                        <div className="space-y-1">
                          <span>
                            {translateServiceHistoryType(car.service_history_type || car.serviceHistoryType)}
                          </span>
                          {(car.has_service_history || car.hasServiceHistory) && (
                            <div className="text-sm text-green-600 font-medium mt-2">
                              ✓ Pełna historia serwisowa dostępna
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-subtitle-text">Nie podano</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {car.sellerNotes && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Uwagi</h4>
                  <p className="text-sm leading-relaxed">{car.sellerNotes}</p>
                </div>
              )}

              {/* Vehicle Features */}
              {car.features && Object.keys(car.features).length > 0 && (() => {
                // Filter features to only show ones that are true
                const activeFeatures = Object.entries(car.features)
                  .filter(([_, value]) => value === true)
                  .map(([key, _]) => {
                    // Handle both camelCase and underscore_case formats
                    let readableKey = key;
                    
                    // If it has underscores, convert them to spaces
                    if (key.includes('_')) {
                      readableKey = key
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    } else {
                      // Handle camelCase: add space before capitals, then title case
                      readableKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();
                    }
                    
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

              {/* Vehicle Condition & Additional Info */}
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                <h4 className="font-medium text-base mb-3 text-body-text">{translateSpecificationLabel('Vehicle Condition')}</h4>
                <div className="text-sm space-y-2">
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Damaged')}:</span> <span className="font-medium text-body-text">{car.isDamaged ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Registered in Poland')}:</span> <span className="font-medium text-body-text">{car.isRegisteredInPoland ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  <p><span className="text-subtitle-text">{translateSpecificationLabel('Full Registration Document')}:</span> <span className="font-medium text-body-text">{car.hasFullRegistrationDocument ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  {(car.is_selling_on_behalf !== undefined || car.isSellingOnBehalf !== undefined) && (
                    <p><span className="text-subtitle-text">Sprzedaż w imieniu osoby trzeciej:</span> <span className="font-medium text-body-text">{(car.is_selling_on_behalf || car.isSellingOnBehalf) ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                  )}
                  {car.finance_amount && (
                    <p><span className="text-subtitle-text">Zadłużenie finansowe:</span> <span className="font-medium text-body-text">{formatCurrency(car.finance_amount)}</span></p>
                  )}
                  {(car.finance_document_name || car.financeDocumentName) && (
                    <p><span className="text-subtitle-text">Dokument finansowy:</span> <span className="font-medium text-body-text">{car.finance_document_name || car.financeDocumentName}</span></p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-base mb-3">{translateSpecificationLabel('Location')}</h4>
                <p className="text-sm font-medium">
                  {car.town && car.county 
                    ? `${car.town}, ${car.county}` 
                    : car.town || car.county || 'Lokalizacja nie podana'}
                </p>
              </div>
            </div>
          </div>

          {/* Auction Details - Takes up 1 column on xl screens */}
          <div className="xl:col-span-1 space-y-6">
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
                <h3 className="font-semibold mb-2">Aukcja zakończona</h3>
                {car.auction_status === 'sold' ? (
                  <p className="text-green-600 font-medium">Pojazd sprzedany</p>
                ) : (
                  <p className="text-gray-600">Brak sprzedaży</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
