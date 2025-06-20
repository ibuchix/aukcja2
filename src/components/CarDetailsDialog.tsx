
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import BasicSpecifications from "./car-details/BasicSpecifications";
import { ConditionAndFeatures } from "./car-details/ConditionAndFeatures";
import ServiceHistory from "./car-details/ServiceHistory";
import { VehiclePhotos } from "./car-details/VehiclePhotos";
import Location from "./car-details/Location";
import AdditionalInfo from "./car-details/AdditionalInfo";
import { VerificationBanner } from "@/components/dealer/VerificationBanner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateAuctionTimingStatus } from "@/components/dealer/auction/hooks/utils/auctionTimingUtils";

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  const { isAuthenticated } = useAuth();
  const { dealerProfile, isVerified } = useCurrentDealerProfile();
  
  // Fetch auction schedule data only for authenticated dealers
  const { data: auctionScheduleData } = useQuery({
    queryKey: ["carAuctionSchedule", car?.id],
    queryFn: async () => {
      if (!car?.id || !isAuthenticated || !dealerProfile) {
        return null;
      }

      console.log('Fetching auction schedule for authenticated dealer:', car.id);
      
      const { data, error } = await supabase
        .from('auction_schedules')
        .select('*')
        .eq('car_id', car.id)
        .single();

      if (error) {
        console.log('No auction schedule found or access denied:', error.message);
        return null;
      }

      return data;
    },
    enabled: Boolean(car?.id && isAuthenticated && dealerProfile),
    retry: false
  });
  
  if (!car) return null;

  const minimumBidIncrement = car.minimumBidIncrement || 100;
  const currentHighestBid = car.currentBid || car.reservePrice;
  
  // Calculate auction timing status from fetched schedule data - with proper null checks
  const auctionTimingStatus = auctionScheduleData &&
    typeof auctionScheduleData === 'object' &&
    auctionScheduleData !== null &&
    'start_time' in auctionScheduleData &&
    'end_time' in auctionScheduleData &&
    'status' in auctionScheduleData &&
    typeof auctionScheduleData.start_time === 'string' &&
    typeof auctionScheduleData.end_time === 'string' &&
    typeof auctionScheduleData.status === 'string'
    ? calculateAuctionTimingStatus(
        auctionScheduleData.start_time,
        auctionScheduleData.end_time,
        auctionScheduleData.status
      )
    : 'unknown';
  
  // Enhanced car object with auction schedule data for dealers - with proper null checks
  const enhancedCar = {
    ...car,
    scheduleStatus: auctionScheduleData &&
      typeof auctionScheduleData === 'object' &&
      auctionScheduleData !== null &&
      'status' in auctionScheduleData &&
      typeof auctionScheduleData.status === 'string'
      ? auctionScheduleData.status
      : undefined,
    scheduleStartTime: auctionScheduleData &&
      typeof auctionScheduleData === 'object' &&
      auctionScheduleData !== null &&
      'start_time' in auctionScheduleData &&
      typeof auctionScheduleData.start_time === 'string'
      ? auctionScheduleData.start_time
      : undefined,
    scheduleEndTime: auctionScheduleData &&
      typeof auctionScheduleData === 'object' &&
      auctionScheduleData !== null &&
      'end_time' in auctionScheduleData &&
      typeof auctionScheduleData.end_time === 'string'
      ? auctionScheduleData.end_time
      : undefined,
    auctionTimingStatus
  };
  
  console.log('CarDetailsDialog - enhanced car data for dealer:', {
    carId: car.id,
    isAuthenticated,
    isDealerProfile: Boolean(dealerProfile),
    hasScheduleData: Boolean(auctionScheduleData),
    auctionTimingStatus
  });
  
  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {car.year} {car.make} {car.model}
            </span>
            <span className="text-2xl text-primary">
              {formatCurrency(car.currentBid || car.reservePrice)}
            </span>
          </DialogTitle>
          <DialogDescription>
            View detailed information about this vehicle
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <VehiclePhotos car={car} />
            <BasicSpecifications car={car} />
            <ConditionAndFeatures car={car} />
            <ServiceHistory car={car} />
            <Location car={car} />
            <AdditionalInfo car={car} />
            
            {/* Layered security: Only show bidding interface to authenticated, verified dealers */}
            {isAuthenticated && dealerProfile ? (
              <div className="mt-8 border-t pt-6">
                {isVerified ? (
                  <MaxBidInterface
                    carId={car.id}
                    dealerId={dealerProfile.id}
                    currentHighestBid={currentHighestBid}
                    minimumIncrement={minimumBidIncrement}
                    auctionEndTime={car.auctionEndTime || ""}
                    reservePrice={car.reservePrice}
                    isVerified={isVerified}
                    scheduleStatus={enhancedCar.scheduleStatus}
                    scheduleStartTime={enhancedCar.scheduleStartTime}
                    scheduleEndTime={enhancedCar.scheduleEndTime}
                    auctionTimingStatus={enhancedCar.auctionTimingStatus}
                  />
                ) : (
                  <div className="space-y-4">
                    <VerificationBanner verificationStatus={dealerProfile.verification_status} />
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Verification Required for Bidding</h3>
                      <p className="text-blue-800 mb-3">
                        Only verified dealers can place bids on vehicles. Please complete your dealer verification to participate in auctions.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = "/dealer/profile"}
                      >
                        Complete Verification
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Dealer Access Required</h3>
                  <p className="text-gray-700 mb-3">
                    To view auction details and place bids, please sign in with a dealer account.
                  </p>
                  <Button className="w-full" onClick={() => window.location.href = "/auth?tab=login"}>
                    Sign In as Dealer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
