import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidEventSubscription, BidMonitoringFilters } from "@/components/dealer/bid-monitoring/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { isValidRecord, isValidCarData } from "@/utils/supabaseHelpers";

class BidEventService {
  private static instance: BidEventService;
  private subscriptions: Map<string, BidEventSubscription> = new Map();
  private channels: Map<string, RealtimeChannel> = new Map();
  private dealerId: string | null = null;
  private readonly supabaseClient = supabase; // Use a consistent name

  private constructor() {}

  public static getInstance(): BidEventService {
    if (!BidEventService.instance) {
      BidEventService.instance = new BidEventService();
    }
    return BidEventService.instance;
  }

  public setDealerId(dealerId: string): void {
    this.dealerId = dealerId;
  }

  public subscribe(subscription: BidEventSubscription): () => void {
    const { channelName, filters, onBidEvent } = subscription;
    
    // Store the subscription
    this.subscriptions.set(channelName, subscription);
    
    // Create a channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = this.supabaseClient.channel(channelName);
      
      // Listen for bid changes
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bids',
          },
          (payload) => {
            this.handleBidChange(payload, filters, onBidEvent);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cars',
          },
          (payload) => {
            this.handleCarChange(payload, filters, onBidEvent);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'audit_logs',
            filter: `action=eq.auto_proxy_bid`,
          },
          (payload) => {
            this.handleProxyBidLog(payload, filters, onBidEvent);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
    }
    
    // Return a function to unsubscribe
    return () => {
      this.unsubscribe(channelName);
    };
  }

  public unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabaseClient.removeChannel(channel);
      this.channels.delete(channelName);
    }
    this.subscriptions.delete(channelName);
  }

  private handleBidChange(payload: any, filters: BidMonitoringFilters, onBidEvent: (activity: BidActivity) => void): void {
    // Handle different types of bid changes
    if (payload.eventType === 'INSERT') {
      // New bid placed
      const newBid = payload.new as any;
      
      // Apply filters
      if (!this.passesFilters(newBid, filters)) {
        return;
      }
      
      // Create activity
      const activity: BidActivity = {
        id: `bid-${newBid.id}-new`,
        timestamp: newBid.created_at,
        type: 'new_bid',
        carId: newBid.car_id,
        carTitle: "New Bid", // We'll fetch this asynchronously
        bidAmount: newBid.amount,
        bidId: newBid.id,
        dealerId: newBid.dealer_id,
        isOwnActivity: newBid.dealer_id === this.dealerId
      };
      
      // Fetch additional car details
      this.enrichBidActivity(activity).then(enrichedActivity => {
        onBidEvent(enrichedActivity);
      });
      
    } else if (payload.eventType === 'UPDATE') {
      // Bid status changed
      const updatedBid = payload.new as any;
      const oldBid = payload.old as any;
      
      if (updatedBid.status !== oldBid.status) {
        // Apply filters
        if (!this.passesFilters(updatedBid, filters)) {
          return;
        }
        
        // Determine activity type
        let activityType: 'outbid' | 'won' | 'lost' = 'outbid';
        if (updatedBid.status === 'won') activityType = 'won';
        else if (updatedBid.status === 'lost') activityType = 'lost';
        
        // Create activity
        const activity: BidActivity = {
          id: `bid-${updatedBid.id}-${updatedBid.status}`,
          timestamp: updatedBid.updated_at,
          type: activityType,
          carId: updatedBid.car_id,
          carTitle: "Status Change", // We'll fetch this asynchronously
          bidAmount: updatedBid.amount,
          bidId: updatedBid.id,
          dealerId: updatedBid.dealer_id,
          isOwnActivity: updatedBid.dealer_id === this.dealerId
        };
        
        // Fetch additional car details
        this.enrichBidActivity(activity).then(enrichedActivity => {
          onBidEvent(enrichedActivity);
        });
      }
    }
  }

  private handleCarChange(payload: any, filters: BidMonitoringFilters, onBidEvent: (activity: BidActivity) => void): void {
    const newData = payload.new as any;
    const oldData = payload.old as any;
    
    // Check for auction status changes
    if (newData.auction_status !== oldData.auction_status &&
       ['ended', 'sold'].includes(newData.auction_status)) {
      
      // Apply filters
      if (filters.carMake && filters.carMake.length > 0 && 
          !filters.carMake.includes(newData.make)) {
        return;
      }
      
      const activity: BidActivity = {
        id: `auction-${newData.id}-${newData.auction_status}`,
        timestamp: new Date().toISOString(),
        type: 'auction_ended',
        carId: newData.id,
        carTitle: newData.title || `${newData.year} ${newData.make} ${newData.model}`,
        isOwnActivity: false // This is a system event
      };
      
      onBidEvent(activity);
    }
  }

  private handleProxyBidLog(payload: any, filters: BidMonitoringFilters, onBidEvent: (activity: BidActivity) => void): void {
    const newLog = payload.new as any;
    const details = newLog.details as Record<string, any> | null;
    
    // Apply filters
    if (filters.onlyMyBids && newLog.user_id !== this.dealerId) {
      return;
    }
    
    const activity: BidActivity = {
      id: `proxy-${newLog.id}`,
      timestamp: newLog.created_at,
      type: 'proxy_executed',
      carId: newLog.entity_id,
      carTitle: "Proxy Bid", // We'll fetch this asynchronously
      bidAmount: details?.result?.amount || 0,
      bidId: details?.result?.bid_id,
      dealerId: newLog.user_id,
      isOwnActivity: newLog.user_id === this.dealerId
    };
    
    // Fetch additional car details
    this.enrichBidActivity(activity).then(enrichedActivity => {
      onBidEvent(enrichedActivity);
    });
  }

  private async enrichBidActivity(activity: BidActivity): Promise<BidActivity> {
    // If we already have the car title, return as is
    if (activity.carTitle && activity.carTitle !== "New Bid" && 
        activity.carTitle !== "Status Change" && activity.carTitle !== "Proxy Bid") {
      return activity;
    }
    
    try {
      // Fetch car details
      const { data: carData, error } = await this.supabaseClient
        .from("cars")
        .select("title, make, model, year, auction_end_time")
        .eq("id", activity.carId)
        .single();
      
      if (error) throw error;
      
      // Fetch dealer name if needed
      if (activity.dealerId && !activity.dealerName) {
        const { data: dealerData, error: dealerError } = await this.supabaseClient
          .from("dealers")
          .select("dealership_name")
          .eq("id", activity.dealerId)
          .single();
        
        if (!dealerError && dealerData) {
          // Check if dealer data is valid before accessing properties
          if (isValidRecord(dealerData) && 'dealership_name' in dealerData) {
            const dealerName = dealerData.dealership_name as string || 'Unknown Dealer';
            activity.dealerName = dealerName;
          } else {
            activity.dealerName = 'Unknown Dealer';
          }
        }
      }
      
      // Use isValidCarData to ensure we have valid car data before accessing properties
      if (carData && isValidCarData(carData)) {
        const carDetails = {
          title: carData.title || 'Unknown Vehicle',
          displayName: `${carData.year || ''} ${carData.make || ''} ${carData.model || ''}`,
          auction_end_time: carData.auction_end_time
        };
        
        return {
          ...activity,
          carTitle: carDetails.title || 
                    `${carData.year || ''} ${carData.make || ''} ${carData.model || ''}`.trim() || 
                    'Unknown Vehicle',
          auctionEndTime: carDetails.auction_end_time,
          dealerName: activity.dealerName
        };
      }
      
      return activity;
    } catch (error) {
      console.error("Error enriching bid activity:", error);
      return activity;
    }
  }

  private passesFilters(bid: any, filters: BidMonitoringFilters): boolean {
    // Check bid status filter
    if (filters.bidStatus && filters.bidStatus.length > 0) {
      if (!filters.bidStatus.includes(bid.status)) {
        return false;
      }
    }
    
    // Check min/max amount filter
    if (filters.minAmount && bid.amount < filters.minAmount) {
      return false;
    }
    
    if (filters.maxAmount && bid.amount > filters.maxAmount) {
      return false;
    }
    
    // Check "only my bids" filter
    if (filters.onlyMyBids && bid.dealer_id !== this.dealerId) {
      return false;
    }
    
    return true;
  }

  async fetchDealerDetails(dealerId: string): Promise<any> {
    try {
      const { data: dealer } = await this.supabaseClient
        .from('dealers')
        .select('dealership_name')
        .eq('id', dealerId)
        .single();
      
      // Use proper type checking before accessing properties
      if (dealer && isValidRecord(dealer)) {
        return {
          dealershipName: safeGetProperty(dealer, 'dealership_name', 'Unknown Dealership')
        };
      }
      
      return {
        dealershipName: 'Unknown Dealership'
      };
    } catch (error) {
      console.error('Error fetching dealer details:', error);
      return {
        dealershipName: 'Unknown Dealership'
      };
    }
  }

  async fetchCarDetails(carId: string): Promise<any> {
    try {
      const { data: car } = await this.supabaseClient
        .from('cars')
        .select('title, year, make, model, auction_end_time')
        .eq('id', carId)
        .single();
      
      // Use proper type checking before accessing properties
      if (car && isValidCarData(car)) {
        return {
          title: car.title || `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim() || 'Unknown Vehicle',
          year: car.year,
          make: car.make,
          model: car.model,
          auction_end_time: car.auction_end_time
        };
      }
      
      return {
        title: 'Unknown Vehicle',
        year: null,
        make: null,
        model: null,
        auction_end_time: null
      };
    } catch (error) {
      console.error('Error fetching car details:', error);
      return {
        title: 'Unknown Vehicle',
        year: null,
        make: null,
        model: null,
        auction_end_time: null
      };
    }
  }
}

export default BidEventService;
