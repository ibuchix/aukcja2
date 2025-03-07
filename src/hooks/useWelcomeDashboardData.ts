
import { User } from "@supabase/supabase-js";
import { useDealerProfile } from "./dealer-dashboard/useDealerProfile";
import { useRecentActivity } from "./dealer-dashboard/useRecentActivity";
import { useDirectQueryTest } from "./dealer-dashboard/useDirectQueryTest";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const { dealerProfile, profileDataLoading, profileFetchAttempted } = useDealerProfile(user, isAuthLoading);
  const recentActivity = useRecentActivity();
  const directQueryResult = useDirectQueryTest(user, isAuthLoading);

  return {
    dealerProfile,
    recentActivity,
    profileDataLoading,
    profileFetchAttempted,
    directQueryResult
  };
}
