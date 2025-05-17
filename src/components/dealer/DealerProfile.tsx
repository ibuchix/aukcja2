
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
    refreshProfile
  } = useDealerProfile();
  
  const { refreshSession } = useAuth();
  const { toast } = useToast();
  
  // Track refresh state using useState to trigger re-renders
  const [refreshState, setRefreshState] = useState({
    hasTriedRefresh: false,
    isRefreshing: false,
    didErrorPersist: false
  });
  
  // Circuit breaker to prevent infinite refresh attempts
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 1; // Limit to only one retry
  const hasShownToast = useRef(false);

  // Attempt to refresh profile data if there's an error
  useEffect(() => {
    // Only try to recover if:
    // 1. There's an error
    // 2. We've actually tried to fetch at least once
    // 3. We haven't already attempted a refresh
    // 4. We're not currently loading data
    if (error && fetchAttempted && !isLoading && !refreshState.hasTriedRefresh && !refreshState.isRefreshing) {
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
        setRefreshState({
          hasTriedRefresh: true,
          isRefreshing: true,
          didErrorPersist: false
        });
        
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
          setRefreshState({
            hasTriedRefresh: true,
            isRefreshing: false,
            didErrorPersist: true
          });
        }
      };
      
      tryRefresh();
    }
    
    // If error is cleared, reset our refresh state
    if (!error && refreshState.hasTriedRefresh) {
      setRefreshState({
        hasTriedRefresh: false,
        isRefreshing: false,
        didErrorPersist: false
      });
      refreshAttempts.current = 0;
    }
  }, [error, fetchAttempted, isLoading, refreshSession, refreshProfile, toast, refreshState.hasTriedRefresh, refreshState.isRefreshing]);

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
          didErrorPersist: false
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

  if (profileStatus === "not_found" && fetchAttempted) {
    return (
      <DealerProfileIncomplete 
        profileStatus={profileStatus}
        needsRecovery={needsRecovery}
        initiateProfileRecovery={initiateProfileRecovery}
      />
    );
  }

  if (profileStatus === "incomplete" && fetchAttempted) {
    return (
      <DealerProfileIncomplete 
        profileStatus={profileStatus}
        needsRecovery={needsRecovery}
        initiateProfileRecovery={initiateProfileRecovery}
      />
    );
  }

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
