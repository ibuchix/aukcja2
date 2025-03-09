
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
    refreshProfile,
    fetchDealerProfileData
  } = useDealerProfileData();

  // Fetch dealer profile on context init
  useEffect(() => {
    fetchDealerProfileData();
  }, []);

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
