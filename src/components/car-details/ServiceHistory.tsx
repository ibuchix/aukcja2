
import { Wrench } from "lucide-react";
import { CarListing } from "@/types/cars";

interface ServiceHistoryProps {
  car: CarListing;
}

const ServiceHistory = ({ car }: ServiceHistoryProps) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
    <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
      <Wrench className="w-5 h-5" />
      Service History
    </h3>
    {car.service_history_type ? (
      <div className="space-y-2">
        <p className="text-subtitle-text">Service History Type</p>
        <div className="grid grid-cols-1 gap-2">
          <div className="text-iris capitalize">
            {car.service_history_type.replace(/_/g, ' ')}
          </div>
          {car.has_service_history && (
            <div className="text-green-600 text-sm">
              ✓ Service history documentation available
            </div>
          )}
        </div>
      </div>
    ) : (
      <p className="text-subtitle-text">No service history information available</p>
    )}
  </div>
);

export default ServiceHistory;
