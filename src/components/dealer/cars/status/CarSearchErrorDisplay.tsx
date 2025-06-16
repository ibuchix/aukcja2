
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CarSearchErrorDisplayProps {
  errorMessage: string;
  onRefresh: () => void;
}

// Helper function to safely extract readable error message
const getReadableErrorMessage = (errorMessage: string): string => {
  if (!errorMessage || errorMessage === "[object Object]") {
    return "An unexpected error occurred while loading vehicles";
  }
  
  // Handle session-related errors
  if (errorMessage.includes('no_session') || errorMessage.includes('Session invalid')) {
    return "Your session has expired. Please sign in again to continue.";
  }
  
  // Handle common error patterns
  if (errorMessage.includes('permission denied') || errorMessage.includes('42501')) {
    return "Permission error: Unable to access vehicle data";
  }
  
  if (errorMessage.includes('PGRST301')) {
    return "Authentication error: Please refresh your session";
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return "Network error: Please check your connection and try again";
  }
  
  return errorMessage;
};

export const CarSearchErrorDisplay = ({ 
  errorMessage, 
  onRefresh 
}: CarSearchErrorDisplayProps) => {
  const { signOut } = useAuth();
  const readableError = getReadableErrorMessage(errorMessage);
  
  const isSessionError = 
    errorMessage.includes('no_session') || 
    errorMessage.includes('Session invalid');
    
  const isPossiblePermissionError = 
    errorMessage.includes('permission denied') || 
    errorMessage.includes('42501') ||
    errorMessage.includes('PGRST301');

  const handleRefreshWithAuth = async () => {
    if (isPossiblePermissionError || isSessionError) {
      try {
        console.log("Attempting to refresh authentication session...");
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("Session refresh error:", error);
        } else {
          console.log("Session refreshed successfully");
        }
      } catch (err) {
        console.error("Failed to refresh session:", err);
      }
    }
    
    // Call the parent onRefresh regardless of session refresh outcome
    onRefresh();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4 mr-2" />
      <AlertTitle>Error Loading Vehicles</AlertTitle>
      <AlertDescription className="mt-2 mb-4">
        {readableError}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs opacity-80 font-mono">
            Debug: {errorMessage}
          </div>
        )}
      </AlertDescription>
      <div className="flex gap-2">
        <Button 
          onClick={handleRefreshWithAuth} 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-gray-100 border-destructive text-destructive"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isPossiblePermissionError || isSessionError ? "Refresh Session & Try Again" : "Try Again"}
        </Button>
        
        {isSessionError && (
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm" 
            className="bg-white hover:bg-gray-100 border-destructive text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out & Sign In Again
          </Button>
        )}
      </div>
    </Alert>
  );
};
