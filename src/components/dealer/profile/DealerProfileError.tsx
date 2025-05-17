
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DealerProfileErrorProps {
  error: string;
  refreshProfile: () => void;
}

export function DealerProfileError({ error, refreshProfile }: DealerProfileErrorProps) {
  const navigate = useNavigate();
  
  // Determine error type and provide appropriate guidance
  const isPermissionError = error.includes("403") || error.includes("permission");
  const isNetworkError = error.includes("network") || error.includes("fetch") || error.includes("timeout");
  const isAuthError = error.includes("auth") || error.includes("token") || error.includes("JWT");
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading profile</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          {error}
        </p>
        {isPermissionError && (
          <p className="text-sm">
            This appears to be a permissions issue. Your account may not have the correct access rights.
            {error.includes("RLS") && " The database security policy (RLS) is preventing access to your data."}
          </p>
        )}
        {isNetworkError && (
          <p className="text-sm">
            This appears to be a network connection issue. Please check your internet connection.
          </p>
        )}
        {isAuthError && (
          <p className="text-sm">
            This appears to be an authentication issue. You may need to sign in again.
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshProfile}
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
          >
            Return to Login
          </Button>
          {isPermissionError && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/complete-registration')}
            >
              Complete Registration
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
