
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

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  const { isAuthenticated } = useAuth();
  const { dealerProfile, isVerified } = useCurrentDealerProfile();
  
  if (!car) return null;

  const minimumBidIncrement = car.minimumBidIncrement || 100;
  const currentHighestBid = car.currentBid || car.reservePrice;
  
  // Debug logging for auction timing status
  console.log('CarDetailsDialog - car data:', {
    carId: car.id,
    make: car.make,
    model: car.model,
    auctionTimingStatus: car.auctionTimingStatus,
    scheduleStatus: car.scheduleStatus,
    scheduleStartTime: car.scheduleStartTime,
    scheduleEndTime: car.scheduleEndTime
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
                    scheduleStatus={car.scheduleStatus}
                    scheduleStartTime={car.scheduleStartTime}
                    scheduleEndTime={car.scheduleEndTime}
                    auctionTimingStatus={car.auctionTimingStatus}
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
                <Button className="w-full" onClick={() => window.location.href = "/auth?tab=login"}>
                  Sign In to Place Bid
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
