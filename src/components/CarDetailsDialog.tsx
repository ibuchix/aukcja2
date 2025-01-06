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
          <DialogTitle>
            {car.year} {car.make} {car.model}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this vehicle
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {car.images?.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${car.make} ${car.model} - Image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
              {car.required_photos &&
                Object.entries(car.required_photos).map(
                  ([key, value]) =>
                    value && (
                      <img
                        key={key}
                        src={value}
                        alt={`${key.replace(/_/g, " ").toUpperCase()}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )
                )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Price</h3>
                <p className="text-2xl text-primary">
                  {formatCurrency(car.price)}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Details</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Mileage: {car.mileage.toLocaleString()} miles</li>
                  <li>Transmission: {car.transmission || "N/A"}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Features</h3>
                <ul className="list-disc list-inside space-y-2">
                  {car.features &&
                    Object.entries(car.features).map(
                      ([key, value]) =>
                        value && (
                          <li key={key}>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </li>
                        )
                    )}
                </ul>
              </div>
              {car.service_history_files && car.service_history_files.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold">
                    Service History Documents
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {car.service_history_files.map((file, index) => (
                      <li key={index}>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Document {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-600">
                  {car.description || "No description available"}
                </p>
              </div>
            </div>
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