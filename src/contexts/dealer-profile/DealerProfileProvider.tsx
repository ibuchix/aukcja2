import React, { createContext, useContext } from 'react';
import { useDealerProfileData } from './useDealerProfileData';
import { DealerProfileContextType } from './types';
import { checkProfileCompleteness } from './profileUtils';
import { useNavigate } from 'react-router-dom';

const DealerProfileContext = createContext<DealerProfileContextType>({
  displayProfile: null,
  rawProfile: null,
  isLoading: true,
  error: null,
  fetchAttempted: false,
  profileStatus: '',
  needsRecovery: false,
  missingFields: [],
  profileIsComplete: false,
  initiateProfileRecovery: () => {},
  refreshProfile: async () => {}
});

export const useDealerProfile = () => useContext(DealerProfileContext);

export function DealerProfileProvider({ children }: { children: React.ReactNode }) {
  const {
    profileData,
    profileStatus,
    needsRecovery,
    loading,
    error,
    updateProfileData,
    updateProfileStatus,
  } = useDealerProfileData();

  // Get missing fields from profile data
  const { isComplete, missing } = checkProfileCompleteness(profileData);

  const navigate = useNavigate();

  return (
    <DealerProfileContext.Provider
      value={{
        displayProfile: profileData,
        rawProfile: profileData,
        isLoading: loading,
        error,
        fetchAttempted: true,
        profileStatus,
        needsRecovery,
        missingFields: missing,
        profileIsComplete: isComplete,
        initiateProfileRecovery: () => {
          // Navigate to recovery flow
          navigate('/complete-registration', { 
            state: { 
              recovery: true,
              userId: profileData?.user_id
            } 
          });
        },
        refreshProfile: async () => {
          // Implement refresh logic
        }
      }}
    >
      {children}
    </DealerProfileContext.Provider>
  );
}
