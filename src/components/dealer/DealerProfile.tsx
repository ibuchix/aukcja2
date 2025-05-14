
import { useDealerProfile } from "@/contexts/dealer-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User as UserIcon, FileText, MapPin, BadgeCheck, AlertCircle, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function DealerProfile() {
  const { 
    displayProfile, 
    isLoading, 
    error, 
    fetchAttempted, 
    profileStatus, 
    needsRecovery,
    initiateProfileRecovery,
    profileIsComplete
  } = useDealerProfile();
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

  if (isLoading) {
    return <DealerProfileSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Check if profile is complete first
  if (profileIsComplete && displayProfile) {
    // Profile is complete, show the normal profile view
    return (
      <Card className="mb-6 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Dealer Profile
            </CardTitle>
            {displayProfile?.verification_status && (
              displayProfile.is_verified ? (
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
                  <span className={`ml-1 ${displayProfile?.is_verified ? 'text-green-600' : 'text-amber-600'}`}>
                    {getValueWithFallback(displayProfile?.verification_status, 'Pending')}
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

  if (profileStatus === "not_found" && fetchAttempted) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Profile not found</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>We couldn't find your dealer profile. You need to complete your registration.</p>
          {needsRecovery ? (
            <Button onClick={initiateProfileRecovery} variant="default">
              Complete Your Profile
            </Button>
          ) : (
            <Button onClick={() => navigate('/complete-registration')} variant="default">
              Complete Registration
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (profileStatus === "incomplete" && fetchAttempted) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Incomplete Profile</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>Your dealer profile is missing important information. Please complete your profile.</p>
          <Button onClick={initiateProfileRecovery} variant="default">
            Update Your Profile
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!displayProfile && fetchAttempted) {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Profile not available</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>We couldn't access your dealer profile. This may be due to a permission issue.</p>
          {needsRecovery ? (
            <Button onClick={initiateProfileRecovery} variant="default">
              Recover Your Profile
            </Button>
          ) : (
            <Button onClick={() => navigate('/complete-registration')} variant="default">
              Complete Registration
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <DealerProfileSkeleton />;
}

function DealerProfileSkeleton() {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
