
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BidStatus {
  success: boolean;
  car_id: string;
  current_bid: number;
  dealer_highest_bid: number | null;
  is_winning: boolean;
  outbid_amount: number;
  reserve_price: number | null;
  reserve_met: boolean;
  auction_status: string;
  auction_end_time: string;
  minimum_bid_increment: number;
  next_min_bid: number;
}

interface BidRecommendation {
  success: boolean;
  current_bid: number;
  minimum_increment: number;
  bid_count: number;
  average_bid_increase: number;
  time_remaining_seconds: number;
  similar_car_average_price: number | null;
  recommendations: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  reserve_price: number | null;
  reserve_met: boolean;
}

interface AuctionActivityMetrics {
  success: boolean;
  car_id: string;
  unique_bidders: number;
  total_bids: number;
  average_time_between_bids_seconds: number | null;
  bid_velocity_per_hour: number;
  first_bid_time: string | null;
  last_bid_time: string | null;
  bid_history: Array<{
    amount: number;
    created_at: string;
    dealer_id: string;
  }>;
  current_bid: number;
  reserve_price: number | null;
  reserve_met: boolean;
  time_remaining_seconds: number;
}

interface OptimalProxyBid {
  success: boolean;
  car_id: string;
  current_bid: number;
  reserve_price: number | null;
  similar_cars_average: number | null;
  current_max_proxy_bid: number | null;
  optimal_proxy_amount: number;
  minimum_valid_bid: number;
  minimum_bid_increment: number;
}

interface DealerBidExposure {
  success: boolean;
  active_bids_count: number;
  winning_bids_count: number;
  outbid_bids_count: number;
  total_active_exposure: number;
  winning_bids_exposure: number;
  proxy_bids_count: number;
  proxy_bids_exposure: number;
  maximum_potential_exposure: number;
}

interface BiddingStrategy {
  success: boolean;
  dealer_id: string;
  total_bids: number;
  winning_bids: number;
  outbid_bids: number;
  win_rate_percentage: number;
  average_outbid_amount: number;
  average_winning_increment: number;
  average_proxy_maximum: number;
  active_auctions_available: number;
  recommendations: {
    proxy_bid_strategy: string;
    manual_bidding_tip: string;
    auction_participation: string;
  };
}

export function useBidCalculations() {
  const { toast } = useToast();
  
  const getBidStatus = async (carId: string, dealerId: string): Promise<BidStatus | null> => {
    try {
      const { data, error } = await supabase.rpc('get_bid_status', {
        p_car_id: carId,
        p_dealer_id: dealerId
      });
      
      if (error) throw error;
      return (data as unknown) as BidStatus;
    } catch (error) {
      console.error("Error fetching bid status:", error);
      toast({
        title: "Error fetching bid status",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const getBidRecommendations = async (carId: string, dealerId: string): Promise<BidRecommendation | null> => {
    try {
      const { data, error } = await supabase.rpc('get_bid_recommendations', {
        p_car_id: carId,
        p_dealer_id: dealerId
      });
      
      if (error) throw error;
      return (data as unknown) as BidRecommendation;
    } catch (error) {
      console.error("Error fetching bid recommendations:", error);
      toast({
        title: "Error fetching bid recommendations",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const getAuctionActivityMetrics = async (carId: string): Promise<AuctionActivityMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_auction_activity_metrics', {
        p_car_id: carId
      });
      
      if (error) throw error;
      return (data as unknown) as AuctionActivityMetrics;
    } catch (error) {
      console.error("Error fetching auction activity metrics:", error);
      toast({
        title: "Error fetching auction metrics",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const calculateOptimalProxyBid = async (
    carId: string, 
    dealerId: string, 
    maxBudget: number
  ): Promise<OptimalProxyBid | null> => {
    try {
      const { data, error } = await supabase.rpc('calculate_optimal_proxy_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_max_budget: maxBudget
      });
      
      if (error) throw error;
      return (data as unknown) as OptimalProxyBid;
    } catch (error) {
      console.error("Error calculating optimal proxy bid:", error);
      toast({
        title: "Error calculating optimal bid",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const getDealerBidExposure = async (dealerId: string): Promise<DealerBidExposure | null> => {
    try {
      const { data, error } = await supabase.rpc('get_dealer_bid_exposure', {
        p_dealer_id: dealerId
      });
      
      if (error) throw error;
      return (data as unknown) as DealerBidExposure;
    } catch (error) {
      console.error("Error fetching dealer bid exposure:", error);
      toast({
        title: "Error fetching bid exposure",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const analyzeBiddingStrategy = async (dealerId: string): Promise<BiddingStrategy | null> => {
    try {
      const { data, error } = await supabase.rpc('analyze_bidding_strategy', {
        p_dealer_id: dealerId
      });
      
      if (error) throw error;
      return (data as unknown) as BiddingStrategy;
    } catch (error) {
      console.error("Error analyzing bidding strategy:", error);
      toast({
        title: "Error analyzing bidding strategy",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };
  
  return {
    getBidStatus,
    getBidRecommendations,
    getAuctionActivityMetrics,
    calculateOptimalProxyBid,
    getDealerBidExposure,
    analyzeBiddingStrategy
  };
}

// React Query hooks for easier data fetching
export function useBidStatus(carId: string | undefined, dealerId: string | undefined) {
  return useQuery({
    queryKey: ['bidStatus', carId, dealerId],
    queryFn: async () => {
      if (!carId || !dealerId) return null;
      const { data, error } = await supabase.rpc('get_bid_status', {
        p_car_id: carId,
        p_dealer_id: dealerId
      });
      if (error) throw error;
      return (data as unknown) as BidStatus;
    },
    enabled: !!carId && !!dealerId
  });
}

export function useBidRecommendations(carId: string | undefined, dealerId: string | undefined) {
  return useQuery({
    queryKey: ['bidRecommendations', carId, dealerId],
    queryFn: async () => {
      if (!carId || !dealerId) return null;
      const { data, error } = await supabase.rpc('get_bid_recommendations', {
        p_car_id: carId,
        p_dealer_id: dealerId
      });
      if (error) throw error;
      return (data as unknown) as BidRecommendation;
    },
    enabled: !!carId && !!dealerId
  });
}

export function useAuctionActivityMetrics(carId: string | undefined) {
  return useQuery({
    queryKey: ['auctionActivityMetrics', carId],
    queryFn: async () => {
      if (!carId) return null;
      const { data, error } = await supabase.rpc('get_auction_activity_metrics', {
        p_car_id: carId
      });
      if (error) throw error;
      return (data as unknown) as AuctionActivityMetrics;
    },
    enabled: !!carId
  });
}

export function useDealerBidExposure(dealerId: string | undefined) {
  return useQuery({
    queryKey: ['dealerBidExposure', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.rpc('get_dealer_bid_exposure', {
        p_dealer_id: dealerId
      });
      if (error) throw error;
      return (data as unknown) as DealerBidExposure;
    },
    enabled: !!dealerId
  });
}

export function useBiddingStrategy(dealerId: string | undefined) {
  return useQuery({
    queryKey: ['biddingStrategy', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.rpc('analyze_bidding_strategy', {
        p_dealer_id: dealerId
      });
      if (error) throw error;
      return (data as unknown) as BiddingStrategy;
    },
    enabled: !!dealerId
  });
}
