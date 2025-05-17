
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
  
  // Function to classify error type for better handling
  const getErrorType = (errorMessage: string | null): 'permission' | 'network' | 'data' | 'auth' | 'unknown' => {
    if (!errorMessage) return 'unknown';
    
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('permission') || lowerError.includes('403') || lowerError.includes('rls')) {
      return 'permission';
    }
    
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('timeout')) {
      return 'network';
    }
    
    if (lowerError.includes('token') || lowerError.includes('auth') || lowerError.includes('jwt')) {
      return 'auth';
    }
    
    if (lowerError.includes('invalid') || lowerError.includes('missing') || lowerError.includes('format')) {
      return 'data';
    }
    
    return 'unknown';
  };

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
    errorType: error ? getErrorType(error) : 'unknown',
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
