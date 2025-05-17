
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { DealerProfileContextType, DealerProfileData, REQUIRED_PROFILE_FIELDS } from "./types";
import { useDealerProfileData } from "./useDealerProfileData";
import { useAuth } from "../AuthContext";
import { recoverDealerProfile } from "@/utils/dealer-profile-utils/recovery";

// Create the context
const DealerProfileContext = createContext<DealerProfileContextType | undefined>(undefined);

export const DealerProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [profileIsComplete, setProfileIsComplete] = useState<boolean>(false);
  
  // Use the custom hook to get profile data
  const { 
    profileData: rawProfile, 
    profileStatus, 
    needsRecovery, 
    loading: isLoading, 
    error: profileError,
    updateProfileData,
    updateProfileStatus 
  } = useDealerProfileData(user?.id);
  
  // Profile for display use (might be modified/sanitized)
  const [displayProfile, setDisplayProfile] = useState<DealerProfileData | null>(null);
  
  // Split error into message and type
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'data' | 'auth' | 'unknown'>('unknown');
  
  // Process profile data when it changes
  useEffect(() => {
    if (rawProfile) {
      // Create a display copy that we can modify if needed
      setDisplayProfile({...rawProfile});
      
      // Check for missing required fields
      const missing = REQUIRED_PROFILE_FIELDS.filter(
        field => !rawProfile[field as keyof DealerProfileData]
      );
      setMissingFields(missing);
      setProfileIsComplete(missing.length === 0);
    } else {
      setDisplayProfile(null);
      setProfileIsComplete(false);
      setMissingFields(REQUIRED_PROFILE_FIELDS);
    }
    
    setFetchAttempted(true);
  }, [rawProfile]);
  
  // Process errors
  useEffect(() => {
    if (profileError) {
      setError(profileError);
      
      // Determine error type
      if (profileError.includes('permission denied') || profileError.includes('42501')) {
        setErrorType('permission');
      } else if (profileError.includes('network') || profileError.includes('connection')) {
        setErrorType('network');
      } else if (profileError.includes('not found') || profileError.includes('no profile')) {
        setErrorType('data');
      } else if (profileError.includes('auth') || profileError.includes('authentication')) {
        setErrorType('auth');
      } else {
        setErrorType('unknown');
      }
    } else {
      setError(null);
      setErrorType('unknown');
    }
  }, [profileError]);
  
  // Function to initiate profile recovery
  const initiateProfileRecovery = async () => {
    try {
      // Call the recovery utility function
      const result = await recoverDealerProfile();
      if (result.success) {
        // Refresh profile data after recovery
        await refreshProfile();
        return;
      }
      
      // Handle failure
      setError(result.error ? String(result.error) : "Profile recovery failed");
      setErrorType('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile recovery failed");
      setErrorType('unknown');
    }
  };
  
  // Function to refresh profile data
  const refreshProfile = async () => {
    try {
      // Force re-fetch of profile data
      setFetchAttempted(false);
      // The useDealerProfileData hook will re-fetch when params change
      return Promise.resolve();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh profile");
      return Promise.reject(err);
    }
  };

  // Context value
  const contextValue: DealerProfileContextType = {
    displayProfile,
    rawProfile,
    isLoading: isLoading || (authLoading && !fetchAttempted),
    error,
    errorType,
    fetchAttempted,
    profileStatus,
    needsRecovery,
    missingFields,
    profileIsComplete,
    initiateProfileRecovery,
    refreshProfile,
  };

  return (
    <DealerProfileContext.Provider value={contextValue}>
      {children}
    </DealerProfileContext.Provider>
  );
};

// Custom hook to use the dealer profile context
export const useDealerProfile = () => {
  const context = useContext(DealerProfileContext);
  if (context === undefined) {
    throw new Error("useDealerProfile must be used within a DealerProfileProvider");
  }
  return context;
};
