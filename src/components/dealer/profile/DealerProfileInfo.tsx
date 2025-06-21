
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BadgeCheck, AlertCircle, UserIcon, Building2, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DealerProfileData } from "@/contexts/dealer-profile";

interface DealerProfileInfoProps {
  displayProfile: DealerProfileData;
}

export function DealerProfileInfo({ displayProfile }: DealerProfileInfoProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Helper functions
  const formatNameForDisplay = (name?: string): string => {
    if (!name) return "Not available";
    
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const getValueWithFallback = (value?: string | null, fallback = "Not available"): string => {
    return value || fallback;
  };

  // Check if dealer is verified (approved status in DB)
  const isVerified = displayProfile?.verification_status === 'approved' || displayProfile?.is_verified === true;

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5 text-primary" />
            Dealer Profile
          </CardTitle>
          {displayProfile?.verification_status && (
            isVerified ? (
              <Badge variant="success" className="flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {displayProfile.verification_status}
              </Badge>
            )
          )}
        </div>
        <CardDescription>
          Your business profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Dealer Information */}
          <div>
            <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
              <UserIcon className="mr-2 h-4 w-4 text-primary" />
              Dealer Information
            </h3>
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Name:</span> {formatNameForDisplay(displayProfile?.supervisor_name)}</p>
              <p><span className="font-medium text-dark">Dealership:</span> {getValueWithFallback(displayProfile?.dealership_name)}</p>
              <p>
                <span className="font-medium text-dark">Verification:</span> 
                <span className={`ml-1 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                  {isVerified ? 'Approved' : getValueWithFallback(displayProfile?.verification_status, 'Pending')}
                </span>
              </p>
              <p><span className="font-medium text-dark">Email:</span> {getValueWithFallback(user?.email)}</p>
            </div>
          </div>
          
          {/* Business Information */}
          <div>
            <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
              <Building2 className="mr-2 h-4 w-4 text-primary" />
              Business Information
            </h3>
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Tax ID:</span> {getValueWithFallback(displayProfile?.tax_id)}</p>
              <p><span className="font-medium text-dark">License:</span> {getValueWithFallback(displayProfile?.license_number)}</p>
              <p>
                <span className="font-medium text-dark">Registry Number:</span> {" "}
                {getValueWithFallback(displayProfile?.business_registry_number)}
              </p>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-primary" />
              Location & Contact
            </h3>
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Address:</span> {getValueWithFallback(displayProfile?.address)}</p>
              {user?.user_metadata?.phone_number && (
                <p><span className="font-medium text-dark">Phone:</span> {getValueWithFallback(user.user_metadata.phone_number)}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dealer/profile')}
            className="text-primary border-primary hover:bg-primary/5"
          >
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
