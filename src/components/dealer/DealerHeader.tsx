
import { MapPin, Phone, BadgeCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface DealerHeaderProps {
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">{profile.dealership_name}</h1>
        
        {/* Verification Status Badge */}
        {profile && (
          <div className="flex items-center">
            {profile.is_verified ? (
              <Badge variant="success" className="flex items-center gap-1 px-3 py-1">
                <BadgeCheck className="h-4 w-4 mr-1" />
                Verified Dealer
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1 px-3 py-1">
                <Clock className="h-4 w-4 mr-1" />
                {profile.verification_status || "Pending Verification"}
              </Badge>
            )}
          </div>
        )}
      </div>
      
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
