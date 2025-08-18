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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Szczegóły pojazdu
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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

          {/* Your Bid Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Twoja oferta</h3>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(bid.amount)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Złożona: {new Date(bid.created_at).toLocaleString('pl-PL')}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column - Car Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5" />
                Dane pojazdu
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Marka:</span>
                  <span className="font-medium">{car.make || 'Brak danych'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{car.model || 'Brak danych'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Rok:</span>
                  <span className="font-medium">{car.year || 'Brak danych'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Cena wywoławcza:</span>
                  <span className="font-medium">
                    {car.reserve_price ? formatCurrency(car.reserve_price) : 'Brak danych'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Auction Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Szczegóły aukcji
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Status aukcji:</span>
                  <span className="font-medium">{car.auction_status || 'Brak danych'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Koniec aukcji:</span>
                  <span className="font-medium">
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
          </div>

          {/* Additional Information */}
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <strong>Uwaga:</strong> To są wszystkie dostępne informacje o pojeździe z Twojej oferty. 
              Szczegółowe dane techniczne, zdjęcia i informacje o sprzedającym są dostępne tylko 
              podczas aktywnej aukcji.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};