import { MapPin, Phone } from "lucide-react";

interface DealerHeaderProps {
  dealerProfile: {
    dealership_name: string;
    address?: string | null;
    license_number: string;
  };
}

export function DealerHeader({ dealerProfile }: DealerHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{dealerProfile.dealership_name}</h1>
      <div className="flex items-center space-x-2 text-subtitle-text">
        {dealerProfile.address && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{dealerProfile.address}</span>
          </div>
        )}
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1" />
          <span>License: {dealerProfile.license_number}</span>
        </div>
      </div>
    </div>
  );
}