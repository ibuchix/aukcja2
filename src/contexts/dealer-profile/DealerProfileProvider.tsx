
import { createContext, useContext, useEffect, ReactNode } from "react";
import { useDealerProfileData } from "./useDealerProfileData";
import { DealerProfileContextType } from "./types";

// Create context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  displayProfile: null,
  rawProfile: null,
  isLoading: true,
  error: null,
  fetchAttempted: false,
  profileStatus: "loading",
  needsRecovery: false,
  missingFields: [],
  profileIsComplete: false,
  initiateProfileRecovery: () => {},
  refreshProfile: async () => {},
});

export const DealerProfileProvider = ({ children }: { children: ReactNode }) => {
  const {
    profileData: rawProfile,
    profileStatus,
    needsRecovery,
    loading: isLoading,
    error,
    updateProfileData,
    updateProfileStatus
  } = useDealerProfileData();

  // Derived values
  const displayProfile = rawProfile;
  const fetchAttempted = !isLoading;
  const missingFields: string[] = [];
  const profileIsComplete = !!(rawProfile && rawProfile.dealership_name);

  // Initialize profile fetch
  useEffect(() => {
    // This is handled by useDealerProfileData
  }, []);

  // Profile recovery function
  const initiateProfileRecovery = () => {
    if (rawProfile) {
      updateProfileStatus('active');
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    // We'll just reuse updateProfileData to trigger a refresh
    if (rawProfile) {
      await updateProfileData({});
    }
  };

  return (
    <DealerProfileContext.Provider
      value={{
        displayProfile,
        rawProfile,
        isLoading,
        error,
        fetchAttempted,
        profileStatus,
        needsRecovery,
        missingFields,
        profileIsComplete,
        initiateProfileRecovery,
        refreshProfile
      }}
    >
      {children}
    </DealerProfileContext.Provider>
  );
};

export const useDealerProfile = () => useContext(DealerProfileContext);
