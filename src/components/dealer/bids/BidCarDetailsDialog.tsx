import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MyBid } from "./types";
import { formatCurrency } from "@/lib/utils";
import { translateTransmission } from "@/lib/transmissionUtils";
import { VehiclePhotos } from "@/components/car-details/VehiclePhotos";
import { Clock, Car, Calendar, Gauge, Settings, Fuel } from "lucide-react";

interface BidCarDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bid: MyBid | null;
}

export const BidCarDetailsDialog = ({ isOpen, onOpenChange, bid }: BidCarDetailsDialogProps) => {
  if (!bid || !bid.car) return null;

  const { car } = bid;

  const getAuctionStatusDisplay = () => {
    switch (bid.auctionTimingStatus) {
      case 'active':
        return { text: 'Aukcja na żywo', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
      case 'ended':
        return { text: 'Aukcja zakończona', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
      case 'scheduled':
        return { text: 'Zaplanowana', variant: 'outline' as const, className: 'bg-blue-50 text-blue-700' };
      default:
        return { text: 'Nieznany', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusDisplay = getAuctionStatusDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Szczegóły pojazdu
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Car Details - Takes up 2 columns on xl screens */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Car Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {car.title || `${car.year} ${car.make} ${car.model}`}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusDisplay.variant} className={statusDisplay.className}>
                  <Clock className="h-3 w-3 mr-1" />
                  {statusDisplay.text}
                </Badge>
                {bid.auctionResult && (
                  <Badge 
                    variant={bid.auctionResult === 'won' ? 'default' : 'secondary'}
                    className={
                      bid.auctionResult === 'won' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {bid.auctionResult === 'won' ? '🎉 Wygrałeś' : '❌ Przegrałeś'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Vehicle Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Zdjęcia Pojazdu</h3>
              <VehiclePhotos car={car as any} showHeader={false} />
            </div>
            
            {/* Vehicle Specifications */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-body-text">Specyfikacja pojazdu</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Rok</span>
                      <span className="font-semibold text-lg text-body-text">{car.year || 'Brak danych'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Przebieg</span>
                      <span className="font-semibold text-lg text-body-text">{(car as any)?.mileage?.toLocaleString() || 'Brak danych'} km</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Skrzynia biegów</span>
                      <span className="font-semibold text-lg text-body-text">{(car as any)?.transmission ? translateTransmission((car as any).transmission) : 'Brak danych'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Rodzaj paliwa</span>
                      <span className="font-semibold text-lg capitalize text-body-text">{(car as any)?.fuel_type || (car as any)?.fuelType || 'Brak danych'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">VIN</span>
                      <span className="font-semibold font-mono text-sm break-all text-body-text">{(car as any)?.vin || 'Brak danych'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Numer rejestracyjny</span>
                      <span className="font-semibold text-lg text-body-text">{(car as any)?.registration_number || 'Brak danych'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Liczba kluczyków</span>
                      <span className="font-semibold text-lg text-body-text">{((car as any)?.numberOfKeys || (car as any)?.number_of_keys) || 'Brak danych'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                      <span className="text-body-text font-medium">Materiał siedzeń</span>
                      <span className="font-semibold text-lg capitalize text-body-text">{(car as any)?.seat_material || (car as any)?.seatMaterial || 'Brak danych'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Features */}
              {(car as any)?.features && Object.keys((car as any).features).length > 0 && (() => {
                // Filter features to only show ones that are true
                const activeFeatures = Object.entries((car as any).features)
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
                    <h4 className="text-xl font-semibold mb-4 text-body-text">Wyposażenie pojazdu</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/30">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-sm font-medium text-body-text">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Service History */}
              {((car as any)?.service_history_type || (car as any)?.has_service_history) && (
                <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                  <h4 className="font-medium text-base mb-3 text-body-text">Historia serwisowa</h4>
                  <div className="text-sm space-y-2">
                    {(car as any)?.service_history_type && (
                      <p><span className="text-subtitle-text">Typ:</span> <span className="font-medium text-body-text">{(car as any).service_history_type}</span></p>
                    )}
                    {(car as any)?.has_service_history && (
                      <p className="text-green-600 font-medium">✓ Dostępna dokumentacja serwisowa</p>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Condition */}
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
                <h4 className="font-medium text-base mb-3 text-body-text">Stan pojazdu</h4>
                <div className="text-sm space-y-2">
                  <p><span className="text-subtitle-text">Uszkodzony:</span> <span className="font-medium text-body-text">{(car as any)?.is_damaged ? 'Tak' : 'Nie'}</span></p>
                  <p><span className="text-subtitle-text">Zarejestrowany w Polsce:</span> <span className="font-medium text-body-text">{((car as any)?.isRegisteredInPoland || (car as any)?.is_registered_in_poland) ? 'Tak' : 'Nie'}</span></p>
                  <p><span className="text-subtitle-text">Tablice prywatne:</span> <span className="font-medium text-body-text">{(car as any)?.has_private_plate ? 'Tak' : 'Nie'}</span></p>
                  {(car as any)?.finance_amount && (
                    <p><span className="text-subtitle-text">Zadłużenie finansowe:</span> <span className="font-medium text-body-text">{formatCurrency((car as any).finance_amount)}</span></p>
                  )}
                </div>
              </div>

              {/* Location */}
              {(car as any)?.address && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Lokalizacja</h4>
                  <p className="text-sm font-medium">{(car as any).address}</p>
                </div>
              )}

              {/* Seller Contact */}
              {(car as any)?.seller_name && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Informacje o sprzedawcy</h4>
                  <div className="text-sm space-y-2">
                    <p><span className="text-muted-foreground">Nazwa:</span> <span className="font-medium">{(car as any).seller_name}</span></p>
                    {(car as any)?.mobile_number && (
                      <p><span className="text-muted-foreground">Kontakt:</span> <span className="font-medium">{(car as any).mobile_number}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Seller Notes */}
              {(car as any)?.seller_notes && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-base mb-3">Uwagi sprzedawcy</h4>
                  <p className="text-sm leading-relaxed">{(car as any).seller_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bid Details - Takes up 1 column on xl screens */}
          <div className="xl:col-span-1 space-y-6">
            {/* Your Bid Section */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Twoja oferta</h3>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(bid.amount)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Złożona: {new Date(bid.created_at).toLocaleString('pl-PL')}
              </div>
            </div>

            {/* Auction Details */}
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Szczegóły aukcji</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Cena wywoławcza:</span>
                  <span className="font-bold text-lg">{car.reserve_price ? formatCurrency(car.reserve_price) : 'Brak danych'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Status aukcji:</span>
                  <span className="font-medium">{car.auction_status || 'Brak danych'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Koniec aukcji:</span>
                  <span className="font-medium text-sm">
                    {car.auction_end_time 
                      ? new Date(car.auction_end_time).toLocaleString('pl-PL')
                      : 'Brak danych'
                    }
                  </span>
                </div>
                {car.awaiting_seller_decision && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="text-sm text-yellow-800">
                      ⏳ Oczekiwanie na decyzję sprzedającego
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                <strong>Uwaga:</strong> Informacje wyświetlane są na podstawie danych dostępnych w momencie składania oferty.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};