
import { useState, useEffect } from "react";

export function useRecentActivity() {
  const [recentActivity, setRecentActivity] = useState<boolean>(false);

  // Set a timeout to simulate loading recent activity
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return recentActivity;
}
