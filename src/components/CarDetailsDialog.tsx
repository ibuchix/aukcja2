
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
import ConditionAndFeatures from "./car-details/ConditionAndFeatures";
import ServiceHistory from "./car-details/ServiceHistory";
import VehiclePhotos from "./car-details/VehiclePhotos";
import Location from "./car-details/Location";
import AdditionalInfo from "./car-details/AdditionalInfo";

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  const { isAuthenticated } = useAuth();
  const { dealerProfile } = useCurrentDealerProfile();
  
  if (!car) return null;

  const minimumBidIncrement = car.minimumBidIncrement || 100;
  const currentHighestBid = car.currentBid || car.reservePrice;
  
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
            <BasicSpecifications car={car} />
            <ConditionAndFeatures car={car} />
            <ServiceHistory car={car} />
            <VehiclePhotos car={car} />
            <Location car={car} />
            <AdditionalInfo car={car} />
            
            {isAuthenticated && dealerProfile ? (
              <div className="mt-8 border-t pt-6">
                <MaxBidInterface
                  carId={car.id}
                  dealerId={dealerProfile.id}
                  currentHighestBid={currentHighestBid}
                  minimumIncrement={minimumBidIncrement}
                  auctionEndTime={car.auctionEndTime || ""}
                  reservePrice={car.reservePrice}
                />
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
