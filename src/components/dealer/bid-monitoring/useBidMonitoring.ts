
import { useState, useEffect } from "react";
import { BidActivity, BidMonitoringFilters, BidMetrics } from "./types";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { fetchInitialBidData } from "./utils/bidDataFetcher";
import { applyFiltersToActivities } from "./utils/filterUtils";
import { useRealtimeSubscriptions } from "./utils/useRealtimeSubscriptions";

export function useBidMonitoring() {
  const { dealerProfile } = useCurrentDealerProfile();
  const [bidActivity, setBidActivity] = useState<BidActivity[]>([]);
  const [metrics, setMetrics] = useState<BidMetrics>({
    activeBidsCount: 0,
    outbidCount: 0,
    wonCount: 0,
    lostCount: 0,
    totalInvested: 0,
    potentialExposure: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BidMonitoringFilters>({
    timeRange: 'all',
    activityTypes: ['new_bid', 'outbid', 'won', 'lost', 'proxy_executed', 'auction_ended']
  });

  // Fetch initial bid activity data
  useEffect(() => {
    async function loadInitialData() {
      if (!dealerProfile?.id) return;
      
      setIsLoading(true);
      try {
        const { activities, calculatedMetrics } = await fetchInitialBidData(dealerProfile.id);
        setBidActivity(activities);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error("Error fetching bid monitoring data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [dealerProfile?.id]);

  // Set up realtime subscriptions
  const addBidActivity = (newActivity: BidActivity) => {
    setBidActivity(prev => [newActivity, ...prev]);
  };

  const updateMetrics = (updater: (prev: BidMetrics) => BidMetrics) => {
    setMetrics(prev => updater(prev));
  };

  useRealtimeSubscriptions(dealerProfile?.id, addBidActivity, updateMetrics);

  // Function to apply filters
  const applyFilters = (newFilters: BidMonitoringFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Get filtered activities
  const filteredActivities = applyFiltersToActivities(bidActivity, filters);

  return {
    bidActivity: filteredActivities,
    metrics,
    isLoading,
    filters,
    applyFilters
  };
}
