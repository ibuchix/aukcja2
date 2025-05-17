
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DealerProfileNotAvailableProps {
  needsRecovery: boolean;
  initiateProfileRecovery: () => void;
}

export function DealerProfileNotAvailable({ 
  needsRecovery,
  initiateProfileRecovery 
}: DealerProfileNotAvailableProps) {
  const navigate = useNavigate();
  
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
