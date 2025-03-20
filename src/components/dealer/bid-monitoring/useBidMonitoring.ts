
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMonitoringFilters, BidMetrics } from "./types";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { format } from "date-fns";

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
    async function fetchInitialData() {
      if (!dealerProfile?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch dealer's bids
        const { data: bids, error: bidsError } = await supabase
          .from("bids")
          .select(`
            id,
            car_id,
            amount,
            status,
            created_at,
            car:cars(
              id,
              title,
              make,
              model,
              year,
              auction_end_time,
              current_bid,
              auction_status
            )
          `)
          .eq("dealer_id", dealerProfile.id)
          .order("created_at", { ascending: false });

        if (bidsError) throw bidsError;

        // Fetch bid history for cars the dealer has bid on
        const carIds = bids.map(bid => bid.car_id);
        const { data: allBids, error: allBidsError } = await supabase
          .from("bids")
          .select(`
            id,
            car_id,
            dealer_id,
            amount,
            status,
            created_at,
            updated_at,
            dealers:dealer_id(dealership_name),
            car:car_id(title, make, model, year, auction_end_time)
          `)
          .in("car_id", carIds)
          .order("created_at", { ascending: false });

        if (allBidsError) throw allBidsError;

        // Fetch proxy bid executions from audit logs
        const { data: proxyLogs, error: proxyLogsError } = await supabase
          .from("audit_logs")
          .select("*")
          .in("entity_id", carIds)
          .eq("action", "auto_proxy_bid")
          .order("created_at", { ascending: false });

        if (proxyLogsError) throw proxyLogsError;

        // Transform the data into a unified activity timeline
        const activities: BidActivity[] = [
          // Map regular bids to activities - fixed type to be a specific literal
          ...allBids.map(bid => ({
            id: `bid-${bid.id}`,
            timestamp: bid.created_at,
            type: 'new_bid' as const, // Using type assertion to ensure it's the correct literal type
            carId: bid.car_id,
            carTitle: bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`,
            bidAmount: bid.amount,
            bidId: bid.id,
            dealerId: bid.dealer_id,
            dealerName: bid.dealers?.dealership_name || "Unknown Dealer",
            auctionEndTime: bid.car?.auction_end_time,
            isOwnActivity: bid.dealer_id === dealerProfile.id
          })),
          
          // Map proxy bid logs to activities - fixed type to be a specific literal
          ...proxyLogs.map(log => {
            const details = log.details as Record<string, any> | null;
            return {
              id: `proxy-${log.id}`,
              timestamp: log.created_at,
              type: 'proxy_executed' as const, // Using type assertion to ensure it's the correct literal type
              carId: log.entity_id,
              carTitle: "Car", // We'll need to fetch this separately
              bidAmount: details?.result?.amount || 0,
              bidId: details?.result?.bid_id,
              dealerId: log.user_id,
              isOwnActivity: log.user_id === dealerProfile.id
            };
          })
        ];

        // Sort activities by timestamp (newest first)
        activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setBidActivity(activities);

        // Calculate metrics
        const activeBids = bids.filter(bid => bid.status === 'active');
        const outbidBids = bids.filter(bid => bid.status === 'outbid');
        const wonBids = bids.filter(bid => bid.status === 'won');
        const lostBids = bids.filter(bid => bid.status === 'lost');

        setMetrics({
          activeBidsCount: activeBids.length,
          outbidCount: outbidBids.length,
          wonCount: wonBids.length,
          lostCount: lostBids.length,
          totalInvested: activeBids.reduce((sum, bid) => sum + (bid.amount || 0), 0),
          potentialExposure: activeBids.reduce((sum, bid) => sum + (bid.amount || 0), 0)
        });

      } catch (error) {
        console.error("Error fetching bid monitoring data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();
  }, [dealerProfile?.id]);

  // Set up realtime subscriptions for live updates
  useEffect(() => {
    if (!dealerProfile?.id) return;

    // Subscribe to new bids
    const bidsChannel = supabase
      .channel('bid-monitoring-bids')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          console.log('Bid change received:', payload);
          
          // Handle different types of bid changes
          if (payload.eventType === 'INSERT') {
            // New bid placed
            const newBid = payload.new as any;
            
            // Add this new bid to our activity list
            setBidActivity(prev => {
              const newActivity: BidActivity = {
                id: `bid-${newBid.id}-new`,
                timestamp: newBid.created_at,
                type: 'new_bid', // This is now using the correct literal type
                carId: newBid.car_id,
                carTitle: "New Bid", // We'll need to fetch this from the car table
                bidAmount: newBid.amount,
                bidId: newBid.id,
                dealerId: newBid.dealer_id,
                isOwnActivity: newBid.dealer_id === dealerProfile.id
              };
              
              return [newActivity, ...prev];
            });
            
            // Update metrics if it's the dealer's own bid
            if (newBid.dealer_id === dealerProfile.id) {
              setMetrics(prev => ({
                ...prev,
                activeBidsCount: prev.activeBidsCount + 1,
                totalInvested: prev.totalInvested + newBid.amount
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            // Bid status changed
            const updatedBid = payload.new as any;
            const oldBid = payload.old as any;
            
            if (updatedBid.status !== oldBid.status) {
              // Status changed - create an activity for this
              let activityType: 'outbid' | 'won' | 'lost' = 'outbid';
              
              if (updatedBid.status === 'won') activityType = 'won';
              else if (updatedBid.status === 'lost') activityType = 'lost';
              
              setBidActivity(prev => {
                const newActivity: BidActivity = {
                  id: `bid-${updatedBid.id}-${updatedBid.status}`,
                  timestamp: updatedBid.updated_at,
                  type: activityType,
                  carId: updatedBid.car_id,
                  carTitle: "Status Change", // We'll need to fetch this from the car table
                  bidAmount: updatedBid.amount,
                  bidId: updatedBid.id,
                  dealerId: updatedBid.dealer_id,
                  isOwnActivity: updatedBid.dealer_id === dealerProfile.id
                };
                
                return [newActivity, ...prev];
              });
              
              // Update metrics if it's the dealer's own bid
              if (updatedBid.dealer_id === dealerProfile.id) {
                setMetrics(prev => {
                  const newMetrics = { ...prev };
                  
                  // Remove from active bids if it was active before
                  if (oldBid.status === 'active') {
                    newMetrics.activeBidsCount = Math.max(0, newMetrics.activeBidsCount - 1);
                    newMetrics.totalInvested = Math.max(0, newMetrics.totalInvested - updatedBid.amount);
                  }
                  
                  // Add to the appropriate category
                  if (updatedBid.status === 'outbid') newMetrics.outbidCount++;
                  else if (updatedBid.status === 'won') newMetrics.wonCount++;
                  else if (updatedBid.status === 'lost') newMetrics.lostCount++;
                  
                  return newMetrics;
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Subscribe to auction status changes
    const carsChannel = supabase
      .channel('bid-monitoring-cars')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
        },
        (payload) => {
          console.log('Car update received:', payload);
          
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check for auction status changes
          if (newData.auction_status !== oldData.auction_status &&
             ['ended', 'sold'].includes(newData.auction_status)) {
            
            setBidActivity(prev => {
              const newActivity: BidActivity = {
                id: `auction-${newData.id}-${newData.auction_status}`,
                timestamp: new Date().toISOString(),
                type: 'auction_ended',
                carId: newData.id,
                carTitle: newData.title || `${newData.year} ${newData.make} ${newData.model}`,
                isOwnActivity: false // This is a system event
              };
              
              return [newActivity, ...prev];
            });
          }
        }
      )
      .subscribe();

    // Subscribe to proxy bid events from audit logs
    const auditChannel = supabase
      .channel('bid-monitoring-audit')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `action=eq.auto_proxy_bid`,
        },
        (payload) => {
          console.log('Proxy bid audit log received:', payload);
          
          const newLog = payload.new as any;
          const details = newLog.details as Record<string, any> | null;
          
          setBidActivity(prev => {
            const newActivity: BidActivity = {
              id: `proxy-${newLog.id}`,
              timestamp: newLog.created_at,
              type: 'proxy_executed',
              carId: newLog.entity_id,
              carTitle: "Proxy Bid", // We would need to fetch this
              bidAmount: details?.result?.amount || 0,
              bidId: details?.result?.bid_id,
              dealerId: newLog.user_id,
              isOwnActivity: newLog.user_id === dealerProfile.id
            };
            
            return [newActivity, ...prev];
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(carsChannel);
      supabase.removeChannel(auditChannel);
    };
  }, [dealerProfile?.id]);

  // Function to apply filters
  const applyFilters = (newFilters: BidMonitoringFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // We would implement actual filtering logic here
    // For now, we're just updating the filter state
  };

  // Get filtered activities
  const filteredActivities = bidActivity.filter(activity => {
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
    
    return true;
  });

  return {
    bidActivity: filteredActivities,
    metrics,
    isLoading,
    filters,
    applyFilters
  };
}
