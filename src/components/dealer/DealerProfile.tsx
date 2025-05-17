
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { DealerProfileLoading } from "./profile/DealerProfileLoading";
import { DealerProfileError } from "./profile/DealerProfileError";
import { DealerProfileInfo } from "./profile/DealerProfileInfo";
import { DealerProfileIncomplete } from "./profile/DealerProfileIncomplete";
import { DealerProfileNotAvailable } from "./profile/DealerProfileNotAvailable";
import { DealerProfileSkeleton } from "./profile/DealerProfileSkeleton";

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
  
  // Circuit breaker to prevent infinite refresh attempts
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 1; // Limit to only one retry
  const hasTriedRefresh = useRef(false);

  // Attempt to refresh profile data if there's an error
  useEffect(() => {
    if (error && fetchAttempted && !isLoading && !hasTriedRefresh.current) {
      const tryRefresh = async () => {
        // Check if we've exceeded max attempts
        if (refreshAttempts.current >= maxRefreshAttempts) {
          console.log("Max refresh attempts reached, not trying again");
          return;
        }
        
        refreshAttempts.current += 1;
        hasTriedRefresh.current = true; // Prevent further automatic retries
        
        console.log("Attempting to refresh session due to profile error");
        try {
          await refreshSession();
          toast({
            title: "Session refreshed",
            description: "Attempting to reload your profile data",
            variant: "default"
          });
          
          // Give the session refresh a moment to propagate
          setTimeout(() => {
            refreshProfile();
          }, 1000);
        } catch (err) {
          console.error("Failed to refresh session:", err);
        }
      };
      
      tryRefresh();
    }
  }, [error, fetchAttempted, isLoading, refreshSession, refreshProfile, toast]);

  if (isLoading) {
    return <DealerProfileLoading />;
  }

  if (error) {
    return <DealerProfileError error={error} refreshProfile={refreshProfile} />;
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

  return <DealerProfileSkeleton />;
}
