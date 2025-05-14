
export { DealerProfileProvider, useDealerProfile } from './DealerProfileProvider';
export { DealerProfileData } from './types';
export { checkProfileCompleteness, checkProfileNeedsRecovery, getProfileStatus } from './profileUtils';
// Re-export the REQUIRED_PROFILE_FIELDS with a different name to avoid ambiguity
export { REQUIRED_PROFILE_FIELDS as DEALER_PROFILE_REQUIRED_FIELDS } from './profileUtils';
