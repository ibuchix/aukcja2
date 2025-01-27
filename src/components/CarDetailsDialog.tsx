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
  if (!car) return null;

  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {car.year} {car.make} {car.model}
            </span>
            <span className="text-2xl text-primary">
              {formatCurrency(car.price)}
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
            
            <div className="pt-4">
              <Button className="w-full">Place Bid</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;