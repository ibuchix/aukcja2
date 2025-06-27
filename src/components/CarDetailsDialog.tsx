
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Gauge, MapPin, Clock, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";

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
      return 'Not available';
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

  // Check if dealer is verified
  const isVerified = dealerProfile?.verification_status === 'approved' || dealerProfile?.is_verified === true;

  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{car.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              {car.images && car.images.length > 0 ? (
                <img
                  src={car.images[selectedImageIndex] || car.images[0]}
                  alt={car.title}
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
                {car.images.map((image, index) => (
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
              <Badge 
                variant={isLiveAuction ? "default" : "secondary"}
                className={isLiveAuction ? "bg-green-600" : ""}
              >
                {auctionStatus}
              </Badge>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">
                  {formatPricePLN(car.reservePrice || car.reserve_price)}
                </div>
                <div className="text-sm text-gray-500">
                  Reserve Price
                </div>
                {car.currentBid && car.currentBid > 0 && (
                  <div className="mt-1">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPricePLN(car.currentBid)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Current Bid
                    </div>
                  </div>
                )}
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
                  {(scheduleInfo?.endTime || car.scheduleEndTime) && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <AuctionTimer 
                        auctionEndTime={scheduleInfo?.endTime || car.scheduleEndTime} 
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

        {/* Bidding Interface for Live Auctions */}
        {isLiveAuction && dealerProfile?.id && (
          <div className="mt-6 pt-6 border-t">
            <MaxBidInterface
              carId={car.id}
              dealerId={dealerProfile.id}
              currentHighestBid={car.currentBid || car.current_bid || 0}
              minimumIncrement={car.minimumBidIncrement || car.minimum_bid_increment || 100}
              auctionEndTime={scheduleInfo?.endTime || car.scheduleEndTime || car.auction_end_time}
              reservePrice={car.reservePrice || car.reserve_price}
              isVerified={isVerified}
              scheduleStatus={scheduleInfo?.status || 'running'}
              scheduleStartTime={scheduleInfo?.startTime || car.scheduleStartTime}
              scheduleEndTime={scheduleInfo?.endTime || car.scheduleEndTime}
              auctionTimingStatus={car.auctionTimingStatus || 'running'}
            />
          </div>
        )}

        {/* Call to Action for Non-Live Auctions */}
        {!isLiveAuction && (
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
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
