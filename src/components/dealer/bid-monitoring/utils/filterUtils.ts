
import { BidActivity, BidMonitoringFilters } from "../types";

export function applyFiltersToActivities(activities: BidActivity[], filters: BidMonitoringFilters): BidActivity[] {
  return activities.filter(activity => {
    // Apply type filter if set
    if (filters.activityTypes && filters.activityTypes.length > 0) {
      if (!filters.activityTypes.includes(activity.type)) {
        return false;
      }
    }
    
    // Apply search filter if set
    if (filters.searchQuery && filters.searchQuery.length > 0) {
      const query = filters.searchQuery.toLowerCase();
      if (!activity.carTitle?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Apply time range filter if set
    if (filters.timeRange && filters.timeRange !== 'all') {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      
      switch (filters.timeRange) {
        case 'last_hour':
          if ((now.getTime() - activityDate.getTime()) > 60 * 60 * 1000) {
            return false;
          }
          break;
        case 'today':
          if (activityDate.getDate() !== now.getDate() ||
              activityDate.getMonth() !== now.getMonth() ||
              activityDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          if (activityDate.getDate() !== yesterday.getDate() ||
              activityDate.getMonth() !== yesterday.getMonth() ||
              activityDate.getFullYear() !== yesterday.getFullYear()) {
            return false;
          }
          break;
        case 'last_week':
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          if (activityDate < lastWeek) {
            return false;
          }
          break;
      }
    }
    
    // Apply additional filters here as needed
    
    return true;
  });
}
