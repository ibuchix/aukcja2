
import { useDealerProfile } from "@/contexts/dealer-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User as UserIcon, FileText, MapPin, BadgeCheck, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
          <CardTitle className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5 text-primary" />
            Dealer Profile
          </CardTitle>
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
                <p><span className="font-medium text-dark">Name:</span> {displayProfile?.supervisorName}</p>
                <p><span className="font-medium text-dark">Dealership:</span> {displayProfile?.dealershipName}</p>
                <p>
                  <span className="font-medium text-dark">Verification:</span> 
                  <span className={`ml-1 ${displayProfile?.isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {displayProfile?.verificationStatus}
                  </span>
                </p>
              </div>
            </div>
            
            {/* Business Information */}
            <div>
              <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-primary" />
                Business Information
              </h3>
              <div className="space-y-3 text-subtitle-text">
                <p><span className="font-medium text-dark">Tax ID:</span> {displayProfile?.formattedTaxId || displayProfile?.taxId}</p>
                <p><span className="font-medium text-dark">License:</span> {displayProfile?.licenseNumber}</p>
                <p>
                  <span className="font-medium text-dark">Registry Number:</span> 
                  {displayProfile?.formattedBusinessRegistry || displayProfile?.businessRegistryNumber}
                </p>
              </div>
            </div>
            
            {/* Location */}
            <div>
              <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                Location
              </h3>
              <div className="space-y-3 text-subtitle-text">
                <p><span className="font-medium text-dark">Address:</span> {displayProfile?.address}</p>
              </div>
            </div>
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
