
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMetrics } from "../types";

export function useRealtimeSubscriptions(
  dealerId: string | undefined,
  addActivity: (activity: BidActivity) => void,
  updateMetrics: (updater: (prev: BidMetrics) => BidMetrics) => void
) {
  useEffect(() => {
    if (!dealerId) return;

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
            const newActivity: BidActivity = {
              id: `bid-${newBid.id}-new`,
              timestamp: newBid.created_at,
              type: 'new_bid',
              carId: newBid.car_id,
              carTitle: "New Bid", // We'll need to fetch this from the car table
              bidAmount: newBid.amount,
              bidId: newBid.id,
              dealerId: newBid.dealer_id,
              isOwnActivity: newBid.dealer_id === dealerId
            };
            
            addActivity(newActivity);
            
            // Update metrics if it's the dealer's own bid
            if (newBid.dealer_id === dealerId) {
              updateMetrics(prev => ({
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
              
              const newActivity: BidActivity = {
                id: `bid-${updatedBid.id}-${updatedBid.status}`,
                timestamp: updatedBid.updated_at,
                type: activityType,
                carId: updatedBid.car_id,
                carTitle: "Status Change", // We'll need to fetch this from the car table
                bidAmount: updatedBid.amount,
                bidId: updatedBid.id,
                dealerId: updatedBid.dealer_id,
                isOwnActivity: updatedBid.dealer_id === dealerId
              };
              
              addActivity(newActivity);
              
              // Update metrics if it's the dealer's own bid
              if (updatedBid.dealer_id === dealerId) {
                updateMetrics(prev => {
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
            
            const newActivity: BidActivity = {
              id: `auction-${newData.id}-${newData.auction_status}`,
              timestamp: new Date().toISOString(),
              type: 'auction_ended',
              carId: newData.id,
              carTitle: newData.title || `${newData.year} ${newData.make} ${newData.model}`,
              isOwnActivity: false // This is a system event
            };
            
            addActivity(newActivity);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(carsChannel);
    };
  }, [dealerId, addActivity, updateMetrics]);
}
