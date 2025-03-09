
import { User } from "@supabase/supabase-js";
import { useRecentActivity } from "./dealer-dashboard/useRecentActivity";
import { useDirectQueryTest } from "./dealer-dashboard/useDirectQueryTest";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const recentActivity = useRecentActivity();
  const directQueryResult = useDirectQueryTest(user, isAuthLoading);

  return {
    recentActivity,
    directQueryResult
  };
}
