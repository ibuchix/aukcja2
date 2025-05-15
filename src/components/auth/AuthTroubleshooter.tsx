
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { clearAuthStorage, getAuthDiagnostics } from "@/utils/auth-utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function AuthTroubleshooter() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, unknown> | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    updateDiagnostics();
  }, []);
  
  const updateDiagnostics = () => {
    setDiagnosticInfo(getAuthDiagnostics());
  };
  
  const handleClearAuth = () => {
    clearAuthStorage();
    updateDiagnostics();
    
    toast({
      title: "Auth data cleared",
      description: "All authentication data has been cleared from your browser.",
      duration: 3000
    });
  };
  
  const handleRefreshPage = () => {
    window.location.reload();
  };
  
  // Check if there are any auth tokens that might be causing issues
  const hasAnyAuthTokens = 
    diagnosticInfo?.hasLocalToken === true || 
    diagnosticInfo?.hasLocalDealerToken === true || 
    diagnosticInfo?.hasSessionToken === true;
  
  if (!hasAnyAuthTokens) {
    return null; // Don't show troubleshooter if no auth tokens are present
  }
  
  return (
    <Alert variant="warning" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Troubleshooting</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-sm">
          Having trouble logging in? Your browser might have cached authentication data that's causing issues.
        </p>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" variant="outline" onClick={handleClearAuth}>
            Clear Auth Data
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleRefreshPage}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        {showDetails && diagnosticInfo && (
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(diagnosticInfo, null, 2)}
          </pre>
        )}
      </AlertDescription>
    </Alert>
  );
}
