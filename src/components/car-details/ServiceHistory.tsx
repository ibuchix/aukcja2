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

export default ServiceHistory;