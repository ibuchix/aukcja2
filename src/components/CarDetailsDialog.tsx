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
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Tools, Camera, AlertTriangle, Info } from "lucide-react";

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  if (!car) return null;

  const renderSpecificationGroup = () => (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Info className="w-5 h-5" />
        Basic Specifications
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-subtitle-text">Make</p>
          <p className="font-medium">{car.make || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Model</p>
          <p className="font-medium">{car.model || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Year</p>
          <p className="font-medium">{car.year || "N/A"}</p>
        </div>
        <div>
          <p className="text-subtitle-text">Mileage</p>
          <p className="font-medium">{car.mileage.toLocaleString()} km</p>
        </div>
        <div>
          <p className="text-subtitle-text">Transmission</p>
          <p className="font-medium">{car.transmission || "N/A"}</p>
        </div>
      </div>
    </div>
  );

  const renderConditionGroup = () => (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Condition & Damages
      </h3>
      <div className="space-y-2">
        {car.is_damaged && (
          <Badge variant="destructive">Reported Damage</Badge>
        )}
        <div className="grid grid-cols-1 gap-4">
          {car.features && (
            <div>
              <p className="text-subtitle-text mb-2">Features</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(car.features).map(
                  ([key, value]) =>
                    value && (
                      <Badge key={key} variant="secondary">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </Badge>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceHistoryGroup = () => (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Tools className="w-5 h-5" />
        Service History
      </h3>
      {car.service_history_files && car.service_history_files.length > 0 ? (
        <div className="space-y-2">
          <p className="text-subtitle-text">Documentation Available</p>
          <div className="grid grid-cols-1 gap-2">
            {car.service_history_files.map((file, index) => (
              <a
                key={index}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-iris hover:underline flex items-center gap-2"
              >
                <span>Service Document {index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-subtitle-text">No service history documents available</p>
      )}
    </div>
  );

  const renderPhotosGroup = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Vehicle Photos
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {car.required_photos &&
          Object.entries(car.required_photos).map(
            ([key, value]) =>
              value && (
                <div key={key} className="space-y-2">
                  <img
                    src={value}
                    alt={`${key.replace(/_/g, " ").toUpperCase()}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="text-sm text-subtitle-text text-center">
                    {key.replace(/_/g, " ").toUpperCase()}
                  </p>
                </div>
              )
          )}
      </div>
    </div>
  );

  const renderLocationGroup = () => (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Location
      </h3>
      <p className="text-subtitle-text">
        {car.address || "Location not specified"}
      </p>
    </div>
  );

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
            {renderSpecificationGroup()}
            {renderConditionGroup()}
            {renderServiceHistoryGroup()}
            {renderPhotosGroup()}
            {renderLocationGroup()}
            
            {car.description && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Additional Information
                </h3>
                <p className="text-subtitle-text">{car.description}</p>
              </div>
            )}
            
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