
import { supabase } from "@/integrations/supabase/client";
import BidEventService from "@/services/realtime/BidEventService";

export const enableRealtimeForTables = async () => {
  // Initialize the bid event service
  const bidEventService = BidEventService.getInstance();

  // Create a channel for cars table
  const carsChannel = supabase.channel('cars_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cars'
      },
      (payload) => {
        console.log('Cars change received:', payload);
        
        // Check for auction status changes
        if (payload.eventType === 'UPDATE' && 
            payload.new.auction_status !== payload.old?.auction_status &&
            ['sold', 'ended'].includes(payload.new.auction_status)) {
          
          // Dispatch a custom event that components can listen for
          const event = new CustomEvent('auction_ended', { 
            detail: { 
              carId: payload.new.id,
              status: payload.new.auction_status,
              previousStatus: payload.old?.auction_status,
              currentBid: payload.new.current_bid
            } 
          });
          window.dispatchEvent(event);
        }
      }
    )
    .subscribe();

  // Create a channel for bids table
  const bidsChannel = supabase.channel('bids_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bids'
      },
      (payload) => {
        console.log('Bids change received:', payload);
        
        // Check for bid status changes to 'won' or 'lost'
        if (payload.eventType === 'UPDATE' && 
            ['won', 'lost'].includes(payload.new.status) && 
            payload.old?.status !== payload.new.status) {
          
          // Dispatch custom event for bid result
          const event = new CustomEvent('bid_result', { 
            detail: { 
              bidId: payload.new.id,
              carId: payload.new.car_id,
              dealerId: payload.new.dealer_id,
              status: payload.new.status,
              amount: payload.new.amount
            } 
          });
          window.dispatchEvent(event);
        }
      }
    )
    .subscribe();

  // Create a channel for audit_logs table to track proxy bid executions
  const auditLogsChannel = supabase.channel('audit_logs_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs',
        filter: `action=eq.auto_proxy_bid`
      },
      (payload) => {
        console.log('Proxy bid audit log received:', payload);
        
        // Dispatch custom event for proxy bid execution
        const event = new CustomEvent('proxy_bid_executed', { 
          detail: { 
            logId: payload.new.id,
            entityId: payload.new.entity_id,
            userId: payload.new.user_id,
            details: payload.new.details
          } 
        });
        window.dispatchEvent(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(carsChannel);
    supabase.removeChannel(bidsChannel);
    supabase.removeChannel(auditLogsChannel);
  };
};

// Helper function to enable realtime for specific tables
export const enableRealtimeFor = (table: string, filter?: any) => {
  const channel = supabase.channel(`${table}_realtime`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter })
      },
      (payload) => {
        console.log(`Realtime update for ${table}:`, payload);
        // Dispatch a custom event
        const event = new CustomEvent(`${table}_updated`, { 
          detail: { payload } 
        });
        window.dispatchEvent(event);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};
