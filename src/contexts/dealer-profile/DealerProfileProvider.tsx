
import React, { createContext, useContext, useEffect, useState } from "react";
import { DealerProfileContextType, DealerProfileData, REQUIRED_PROFILE_FIELDS } from "./types";
import { useDealerProfileData } from "./useDealerProfileData";
import { getProfileCompletionStatus } from "./profileUtils";
import { useAuth } from "@/contexts/AuthContext";
import { mapProfileToCamelCase } from "@/utils/dealer-profile-utils/mappers";

// Create the context
const DealerProfileContext = createContext<DealerProfileContextType | null>(null);

// Custom hook to use the context
export const useDealerProfile = (): DealerProfileContextType => {
  const context = useContext(DealerProfileContext);
  
  if (!context) {
    throw new Error("useDealerProfile must be used within a DealerProfileProvider");
  }
  
  return context;
};

export const DealerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    profileData,
    profileStatus,
    needsRecovery,
    loading,
    error,
    updateProfileData,
    updateProfileStatus
  } = useDealerProfileData(user?.id);

  // Derived state
  const displayProfile = profileData ? mapProfileToCamelCase(profileData) : null;
  const rawProfile = profileData;
  const isLoading = loading;
  const fetchAttempted = loading === false;
  
  // Calculate missing fields for profile completion
  const missingFields = profileData ? 
    REQUIRED_PROFILE_FIELDS.filter(field => !profileData[field as keyof DealerProfileData]) : 
    [];
    
  const profileIsComplete = missingFields.length === 0;

  // Function to initiate profile recovery process
  const initiateProfileRecovery = async () => {
    try {
      await updateProfileStatus("recovery_initiated");
    } catch (err) {
      console.error("Failed to initiate profile recovery:", err);
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    try {
      // This logic would depend on how your refresh mechanism works
      console.log("Refreshing profile data");
      // For now we'll just update the timestamp to trigger a refresh 
      await updateProfileData({
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to refresh profile data:", err);
    }
  };

  // Value for the context provider
  const contextValue: DealerProfileContextType = {
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
  };

  return (
    <DealerProfileContext.Provider value={contextValue}>
      {children}
    </DealerProfileContext.Provider>
  );
};
