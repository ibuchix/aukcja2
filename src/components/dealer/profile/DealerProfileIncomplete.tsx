
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DealerProfileIncompleteProps {
  profileStatus: string;
  needsRecovery: boolean;
  initiateProfileRecovery: () => void;
}

export function DealerProfileIncomplete({ 
  profileStatus, 
  needsRecovery,
  initiateProfileRecovery 
}: DealerProfileIncompleteProps) {
  const navigate = useNavigate();
  
  // Not found profile case
  if (profileStatus === "not_found") {
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
  
  // Incomplete profile case
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
