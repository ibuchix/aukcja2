
import { useState, useEffect, useCallback } from "react";
import BidEventService from "@/services/realtime/BidEventService";
import { BidActivity, BidMonitoringFilters } from "@/components/dealer/bid-monitoring/types";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";

interface UseRealtimeBidEventsProps {
  initialFilters?: BidMonitoringFilters;
  maxEventsToStore?: number;
}

export function useRealtimeBidEvents({ 
  initialFilters = {}, 
  maxEventsToStore = 100 
}: UseRealtimeBidEventsProps = {}) {
  const { dealerProfile } = useCurrentDealerProfile();
  const [activities, setActivities] = useState<BidActivity[]>([]);
  const [filters, setFilters] = useState<BidMonitoringFilters>(initialFilters);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Initialize the service and set dealer ID
  useEffect(() => {
    if (dealerProfile?.id) {
      const service = BidEventService.getInstance();
      service.setDealerId(dealerProfile.id);
    }
  }, [dealerProfile?.id]);

  // Handle new bid events
  const handleBidEvent = useCallback((activity: BidActivity) => {
    setActivities(prev => {
      // Add new activity at the beginning of the array
      const newActivities = [activity, ...prev];
      
      // Limit the number of activities to store
      if (newActivities.length > maxEventsToStore) {
        return newActivities.slice(0, maxEventsToStore);
      }
      
      return newActivities;
    });
  }, [maxEventsToStore]);

  // Subscribe to bid events
  useEffect(() => {
    if (!dealerProfile?.id) return;
    
    const channelName = `bid-events-${dealerProfile.id}`;
    const service = BidEventService.getInstance();
    
    const unsubscribe = service.subscribe({
      channelName,
      filters,
      onBidEvent: handleBidEvent
    });
    
    setIsSubscribed(true);
    
    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [dealerProfile?.id, filters, handleBidEvent]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<BidMonitoringFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all activities
  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return {
    activities,
    filters,
    isSubscribed,
    updateFilters,
    clearActivities
  };
}
