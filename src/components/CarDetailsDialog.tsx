
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileStickyBidBar from "@/components/auction/MobileStickyBidBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Gauge, MapPin, Clock, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { VehiclePhotos } from "@/components/car-details/VehiclePhotos";
import BasicSpecifications from "@/components/car-details/BasicSpecifications";
import { ConditionAndFeatures } from "@/components/car-details/ConditionAndFeatures";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

// Type guard for schedule data
interface ValidScheduleData {
  start_time: string;
  end_time: string;
  status: string;
}

function isValidScheduleData(data: any): data is ValidScheduleData {
  return data && 
         typeof data === 'object' && 
         data !== null &&
         !('error' in data) && 
         'start_time' in data && 
         'end_time' in data && 
         'status' in data &&
         typeof data.start_time === 'string' &&
         typeof data.end_time === 'string' &&
         typeof data.status === 'string';
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuth();
  const { dealerProfile } = useDealerProfileSimple();
  const isMobile = useIsMobile();
  const specsRef = useRef<HTMLDivElement>(null);
  const [showStickyBid, setShowStickyBid] = useState(false);
  const [stickyBidDismissed, setStickyBidDismissed] = useState(false);
  // Query for auction schedule data
  const { data: scheduleData } = useQuery({
    queryKey: ["auction-schedule", car?.id],
    queryFn: async () => {
      if (!car?.id) return null;
      
      const { data, error } = await supabase
        .from("auction_schedules")
        .select("*")
        .eq("car_id", car.id)
        .single();

      if (error) {
        console.warn("Could not fetch auction schedule:", error);
        return null;
      }

      return data;
    },
    enabled: !!car?.id,
  });

  // IntersectionObserver: detect when specs section scrolls out of view
  useEffect(() => {
    if (!isMobile || !specsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBid(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(specsRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  if (!car) return null;

  // Safe access to schedule data with explicit validation
  const scheduleInfo = isValidScheduleData(scheduleData) ? {
    startTime: scheduleData.start_time,
    endTime: scheduleData.end_time,
    status: scheduleData.status
  } : null;

  const getAuctionStatus = () => {
    // If this is marked as a live auction, prioritize that
    if (car.isLiveAuction || car.auctionStatus === 'Live Auction') {
      return "Live Auction";
    }
    
    if (!scheduleInfo) return "Available";
    
    const now = new Date();
    const startTime = new Date(scheduleInfo.startTime);
    const endTime = new Date(scheduleInfo.endTime);
    
    if (scheduleInfo.status === 'cancelled') return "Cancelled";
    if (now < startTime) return "Scheduled";
    if (now >= startTime && now <= endTime) return "Live Auction";
    if (now > endTime) return "Ended";
    
    return "Available";
  };

  const auctionStatus = getAuctionStatus();
  const isLiveAuction = auctionStatus === "Live Auction";

  // Format price in PLN
  const formatPricePLN = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'Not specified';
    }
    
    const numPrice = Number(price);
    if (numPrice === 0) {
      return 'No reserve';
    }
    
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Get the correct reserve price using the properly mapped field
  const getReservePrice = () => {
    // Use the correctly processed reservePrice field first
    const reservePrice = car.reservePrice || car.reserve_price || car.price || 0;
    return reservePrice;
  };

  // Check if dealer is verified
  const isVerified = dealerProfile?.verification_status === 'approved' || dealerProfile?.is_verified === true;

  const reservePrice = getReservePrice();
  const formattedReservePrice = formatPricePLN(reservePrice);

  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{car.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Photos */}
          <div className="space-y-4">
            <VehiclePhotos car={car} />
          </div>

          {/* Vehicle Details */}
          <div className="space-y-6">
            {/* Status and Price */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={isLiveAuction ? "default" : "secondary"}
                className={isLiveAuction ? "bg-green-600" : ""}
              >
                {auctionStatus}
              </Badge>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">
                  {formattedReservePrice}
                </div>
                <div className="text-sm text-gray-500">
                  {translateSpecificationLabel('Reserve Price')}
                </div>
                {car.currentBid && car.currentBid > 0 && (
                  <div className="mt-1">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPricePLN(car.currentBid)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {translateSpecificationLabel('Current Bid')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* VIN Display */}
            {car.vin && (
              <div className="space-y-2">
                <h3 className="font-semibold">Vehicle Identification</h3>
                <div className="text-sm">
                  <span className="font-medium">VIN:</span> {car.vin}
                </div>
              </div>
            )}

            {/* Auction Timing */}
            {(scheduleInfo || isLiveAuction) && (
              <div className="space-y-2">
                <h3 className="font-semibold">Auction Schedule</h3>
                <div className="space-y-1 text-sm">
                  {scheduleInfo?.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Started: {new Date(scheduleInfo.startTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Specifications */}
        <div className="mt-6" ref={specsRef}>
          <BasicSpecifications car={car} />
        </div>

        {/* Condition and Features */}
        <div className="mt-6">
          <ConditionAndFeatures car={car} />
        </div>

        {/* Additional Seller Information */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Informacje sprzedawcy</h3>
          
          {car.sellerNotes && (
            <div className="bg-gray-700 text-white p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold mb-2">Notatki sprzedawcy</h4>
              <p className="text-sm">{car.sellerNotes}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-700 p-4 rounded-lg border border-gray-600">
            {car.serviceHistoryType && (
              <div>
                <span className="font-medium">Historia serwisowa:</span> {car.serviceHistoryType}
              </div>
            )}
            {car.numberOfKeys && (
              <div>
                <span className="font-medium">Liczba kluczy:</span> {car.numberOfKeys}
              </div>
            )}
            {car.seatMaterial && (
              <div>
                <span className="font-medium">Materiał siedzeń:</span> {car.seatMaterial}
              </div>
            )}
            {car.registrationNumber && (
              <div>
                <span className="font-medium">Numer rejestracyjny:</span> {car.registrationNumber}
              </div>
            )}
            {car.isRegisteredInPoland !== undefined && (
              <div>
                <span className="font-medium">Zarejestrowany w Polsce:</span> {car.isRegisteredInPoland ? 'Tak' : 'Nie'}
              </div>
            )}
            {car.hasPrivatePlate !== undefined && (
              <div>
                <span className="font-medium">Tablica prywatna:</span> {car.hasPrivatePlate ? 'Tak' : 'Nie'}
              </div>
            )}
          </div>
          
          {car.hasOutstandingFinance && (
            <div className="bg-orange-200 border border-orange-400 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">💰 Informacja finansowa</h4>
              <p className="text-sm text-gray-900">
                Pojazd ma niespłacone finansowanie
                {car.financeAmount && `: ${formatPricePLN(car.financeAmount)}`}
              </p>
              {car.financeDocumentName && (
                <p className="text-sm text-gray-900 mt-2">
                  <span className="font-medium">Dokument finansowy:</span> {car.financeDocumentName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bidding Interface for Live Auctions */}
        {isLiveAuction && dealerProfile?.id && (
          <div className="mt-6 pt-6 border-t">
            <MaxBidInterface
              carId={car.id}
              dealerId={dealerProfile.id}
              currentHighestBid={car.currentBid || car.current_bid || 0}
              minimumIncrement={1} // Allow any increment above current bid
              auctionEndTime={scheduleInfo?.endTime || car.scheduleEndTime || car.auction_end_time}
              reservePrice={reservePrice}
              isVerified={isVerified}
              scheduleStatus={scheduleInfo?.status || 'active'}
              scheduleStartTime={scheduleInfo?.startTime || car.scheduleStartTime}
              scheduleEndTime={scheduleInfo?.endTime || car.scheduleEndTime}
              auctionTimingStatus={car.auctionTimingStatus || 'active'}
            />
          </div>
        )}

        {/* Call to Action for Non-Live Auctions - Only show for non-dealers */}
        {!isLiveAuction && !dealerProfile?.id && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-4">
              To participate in auctions and place bids, you need to register as a verified dealer.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1">
                Register as Dealer
              </Button>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sticky Bid Bar */}
        {isMobile && isLiveAuction && isVerified && dealerProfile?.id && showStickyBid && !stickyBidDismissed && (
          <MobileStickyBidBar
            carId={car.id}
            dealerId={dealerProfile.id}
            currentHighestBid={car.currentBid || car.current_bid || 0}
            reservePrice={reservePrice}
            onDismiss={() => setStickyBidDismissed(true)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
