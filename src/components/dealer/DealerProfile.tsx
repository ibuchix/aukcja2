
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DealerProfileLoading } from "./profile/DealerProfileLoading";
import { DealerProfileError } from "./profile/DealerProfileError";
import { DealerProfileInfo } from "./profile/DealerProfileInfo";
import { DealerProfileIncomplete } from "./profile/DealerProfileIncomplete";
import { DealerProfileNotAvailable } from "./profile/DealerProfileNotAvailable";
import { DealerProfileSkeleton } from "./profile/DealerProfileSkeleton";
import { sessionCircuitBreaker } from "@/utils/sessionCircuitBreaker";
import { Button } from "@/components/ui/button";
import { AlertCircle, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DealerProfile() {
  const { 
    displayProfile, 
    isLoading, 
    error, 
    fetchAttempted, 
    profileStatus, 
    needsRecovery,
    initiateProfileRecovery,
    profileIsComplete,
    missingFields,
    refreshProfile
  } = useDealerProfile();
  
  const { refreshSession, user } = useAuth();
  const { toast } = useToast();
  
  // Track refresh state using useState to trigger re-renders
  const [refreshState, setRefreshState] = useState({
    hasTriedRefresh: false,
    isRefreshing: false,
    didErrorPersist: false,
    lastRefreshAttempt: 0
  });
  
  // Circuit breaker to prevent infinite refresh attempts
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 1; // Limit to only one retry
  const hasShownToast = useRef(false);
  const minRefreshInterval = 10000; // 10 seconds between refresh attempts

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("DealerProfile component state:", {
        user: user?.id,
        profileStatus,
        error,
        displayProfile: displayProfile ? 'exists' : 'null',
        fetchAttempted,
        profileIsComplete,
        missingFields
      });
    }
  }, [user, profileStatus, error, displayProfile, fetchAttempted, profileIsComplete, missingFields]);

  // Attempt to refresh profile data if there's an error, with debouncing
  useEffect(() => {
    // Only try to recover if:
    // 1. There's an error
    // 2. We've actually tried to fetch at least once
    // 3. We haven't already attempted a refresh
    // 4. We're not currently loading data
    // 5. We haven't refreshed recently (debounce)
    const now = Date.now();
    const timeSinceLastRefresh = now - refreshState.lastRefreshAttempt;
    
    if (
      error && 
      fetchAttempted && 
      !isLoading && 
      !refreshState.hasTriedRefresh && 
      !refreshState.isRefreshing &&
      timeSinceLastRefresh > minRefreshInterval
    ) {
      const tryRefresh = async () => {
        // Check if we've exceeded max attempts or if circuit breaker prevents refresh
        if (refreshAttempts.current >= maxRefreshAttempts) {
          console.log("Max refresh attempts reached, not trying again");
          
          // Only show toast once
          if (!hasShownToast.current) {
            toast({
              title: "Profile Loading Issue",
              description: "We're having trouble loading your profile data. Please try again later.",
              variant: "destructive"
            });
            hasShownToast.current = true;
          }
          
          setRefreshState(prev => ({
            ...prev,
            didErrorPersist: true
          }));
          
          return;
        }
        
        // Check if circuit breaker allows refresh
        const canRefresh = sessionCircuitBreaker.getStatus().canRefresh;
        if (!canRefresh) {
          console.log("Circuit breaker preventing profile refresh");
          return;
        }
        
        refreshAttempts.current += 1;
        setRefreshState(prev => ({
          ...prev,
          hasTriedRefresh: true,
          isRefreshing: true,
          lastRefreshAttempt: now
        }));
        
        console.log("Attempting to refresh session due to profile error");
        try {
          await refreshSession();
          toast({
            title: "Refreshing Data",
            description: "Attempting to reload your profile information",
            variant: "default"
          });
          
          // Give the session refresh a moment to propagate
          setTimeout(() => {
            refreshProfile();
            setRefreshState(prev => ({
              ...prev,
              isRefreshing: false
            }));
          }, 1500);
        } catch (err) {
          console.error("Failed to refresh session:", err);
          setRefreshState(prev => ({
            ...prev,
            hasTriedRefresh: true,
            isRefreshing: false,
            didErrorPersist: true
          }));
        }
      };
      
      tryRefresh();
    }
    
    // If error is cleared, reset our refresh state
    if (!error && refreshState.hasTriedRefresh) {
      setRefreshState({
        hasTriedRefresh: false,
        isRefreshing: false,
        didErrorPersist: false,
        lastRefreshAttempt: refreshState.lastRefreshAttempt
      });
      refreshAttempts.current = 0;
    }
  }, [error, fetchAttempted, isLoading, refreshSession, refreshProfile, toast, refreshState]);

  // Show a more visible message when no profile exists
  if (!displayProfile && fetchAttempted && !isLoading && profileStatus === 'not_found') {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-xl">
            <UserCircle2 className="h-6 w-6 mr-2 text-amber-600" /> 
            Profile Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Your dealer profile needs to be set up before you can access all features.</p>
          
          <div className="flex items-center gap-3 mt-4">
            <Button 
              onClick={initiateProfileRecovery}
              className="bg-primary hover:bg-primary/90"
            >
              Complete Your Profile
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => refreshProfile()}
              className="border-amber-300"
            >
              Retry Loading Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state during initial load or refresh
  if (isLoading || refreshState.isRefreshing) {
    return <DealerProfileLoading />;
  }

  // Show error state if error persists after refresh attempt
  if (error && (refreshState.didErrorPersist || refreshAttempts.current >= maxRefreshAttempts)) {
    return <DealerProfileError 
      error={error} 
      refreshProfile={() => {
        // Reset state for a manual refresh
        setRefreshState({
          hasTriedRefresh: false,
          isRefreshing: false,
          didErrorPersist: false,
          lastRefreshAttempt: Date.now()
        });
        refreshAttempts.current = 0;
        
        // Try fetching profile directly without session refresh
        refreshProfile();
      }} 
    />;
  }

  // Check if profile is complete first
  if (profileIsComplete && displayProfile) {
    return <DealerProfileInfo displayProfile={displayProfile} />;
  }

  // Show profile incomplete with appropriate message based on status
  if ((profileStatus === "not_found" || profileStatus === "incomplete") && fetchAttempted) {
    return (
      <DealerProfileIncomplete 
        profileStatus={profileStatus}
        needsRecovery={needsRecovery}
        initiateProfileRecovery={initiateProfileRecovery}
      />
    );
  }

  // Fallback case - profile data is missing but we tried to fetch
  if (!displayProfile && fetchAttempted) {
    return (
      <DealerProfileNotAvailable
        needsRecovery={needsRecovery}
        initiateProfileRecovery={initiateProfileRecovery}
      />
    );
  }

  // Fallback to skeleton during intermediate states
  return <DealerProfileSkeleton />;
}
