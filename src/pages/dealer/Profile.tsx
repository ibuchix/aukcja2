
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, AlertCircle } from "lucide-react";
import { useDealerProfile } from "@/contexts/dealer-profile";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const navigate = useNavigate();
  const { 
    displayProfile, 
    isLoading, 
    error, 
    refreshProfile 
  } = useDealerProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Loading Profile...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Fetching your profile details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p>Error loading profile: {error}</p>
            <div className="flex gap-2">
              <Button onClick={refreshProfile} variant="outline" size="sm">
                Retry
              </Button>
              <Button 
                onClick={() => navigate('/complete-registration')} 
                variant="outline" 
                size="sm"
              >
                Complete Registration
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profile Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No profile data found. Please complete your registration.</p>
            <Button 
              onClick={() => navigate('/complete-registration')} 
              className="mt-4"
            >
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditClick = () => {
    // TODO: Implement edit functionality
    console.log("Edit profile clicked");
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Dealer Profile</CardTitle>
          <CardDescription>View and manage your dealer profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Dealership Information</h3>
              <div className="grid gap-2">
                <div>
                  <p className="text-gray-600">Dealership Name:</p>
                  <p className="font-medium">{displayProfile.dealership_name || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Supervisor Name:</p>
                  <p className="font-medium">{displayProfile.supervisor_name || "Not available"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <div className="grid gap-2">
                <div>
                  <p className="text-gray-600">Tax ID:</p>
                  <p className="font-medium">{displayProfile.tax_id || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Business Registry Number:</p>
                  <p className="font-medium">{displayProfile.business_registry_number || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address:</p>
                  <p className="font-medium">{displayProfile.address || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-600">License Number:</p>
                  <p className="font-medium">{displayProfile.license_number || "Not available"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Account Status</h3>
              <div className="grid gap-2">
                <div>
                  <p className="text-gray-600">Verification Status:</p>
                  <p className="font-medium capitalize">{displayProfile.verification_status || "Pending"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Verified:</p>
                  <p className={`font-medium ${displayProfile.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {displayProfile.is_verified ? 'Yes' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={handleEditClick}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
