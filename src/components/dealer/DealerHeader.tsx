
import { MapPin, Phone } from "lucide-react";

interface DealerHeaderProps {
  profile: any;
  isLoading: boolean;
  error: string | null;
}

export function DealerHeader({ profile, isLoading, error }: DealerHeaderProps) {
  if (isLoading) {
    return <div className="mb-8 animate-pulse h-16 bg-gray-100 rounded"></div>;
  }

  if (error || !profile) {
    return <div className="mb-8 text-red-500">Error loading dealer profile</div>;
  }

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{profile.dealership_name}</h1>
      <div className="flex items-center space-x-2 text-subtitle-text">
        {profile.address && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{profile.address}</span>
          </div>
        )}
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1" />
          <span>License: {profile.license_number}</span>
        </div>
      </div>
    </div>
  );
}
