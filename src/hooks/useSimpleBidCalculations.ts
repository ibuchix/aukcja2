
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BidRecommendation {
  conservative: number;
  moderate: number;
  aggressive: number;
}

interface BidRecommendationData {
  current_bid: number;
  average_bid_increase: number;
  similar_car_average_price?: number;
  reserve_met: boolean;
  recommendations: BidRecommendation;
}

interface DealerBidExposure {
  active_bids_count: number;
  winning_bids_count: number;
  outbid_bids_count: number;
  proxy_bids_count: number; // Always 0 now, kept for compatibility
  winning_bids_exposure: number;
  proxy_bids_exposure: number; // Always 0 now, kept for compatibility
  maximum_potential_exposure: number;
}

// Type for a valid car record
interface CarRecord {
  id: string;
  current_bid: number | null;
  reserve_price: number | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

export const useBidRecommendations = (carId: string, dealerId: string) => {
  return useQuery({
    queryKey: ['bid-recommendations', carId, dealerId],
    queryFn: async (): Promise<BidRecommendationData> => {
      // Get current bid and car details
      const { data: car, error } = await supabase
        .from('cars')
        .select('current_bid, reserve_price, make, model, year')
        .eq('id', carId)
        .single();

      if (error) {
        console.error('Error fetching car data:', error);
        throw new Error('Failed to fetch car data');
      }

      if (!car) {
        throw new Error('Car not found');
      }

      // Now TypeScript knows car is valid, but we still need to safely access properties
      const currentBid = car.current_bid || 0;
      const reservePrice = car.reserve_price || 0;
      
      // Get average bid increase (simplified - use a default of 500)
      const averageBidIncrease = 500;
      
      // Calculate recommendations based on current bid and reserve
      const baseAmount = Math.max(currentBid, reservePrice);
      const minIncrement = 250; // Standard minimum increment
      
      const recommendations: BidRecommendation = {
        conservative: baseAmount + minIncrement,
        moderate: baseAmount + (minIncrement * 2),
        aggressive: baseAmount + (minIncrement * 4)
      };

      return {
        current_bid: currentBid,
        average_bid_increase: averageBidIncrease,
        reserve_met: currentBid >= reservePrice,
        recommendations
      };
    },
    enabled: !!carId && !!dealerId,
  });
};

export const useDealerBidExposure = (dealerId: string) => {
  return useQuery({
    queryKey: ['dealer-bid-exposure', dealerId],
    queryFn: async (): Promise<DealerBidExposure> => {
      // Get dealer's active bids
      const { data: bids, error } = await supabase
        .from('bids')
        .select(`
          id,
          amount,
          status,
          car_id,
          cars!inner(current_bid, auction_status)
        `)
        .eq('dealer_id', dealerId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching dealer bids:', error);
        // Return empty state instead of throwing
        return {
          active_bids_count: 0,
          winning_bids_count: 0,
          outbid_bids_count: 0,
          proxy_bids_count: 0,
          winning_bids_exposure: 0,
          proxy_bids_exposure: 0,
          maximum_potential_exposure: 0,
        };
      }

      if (!bids) {
        return {
          active_bids_count: 0,
          winning_bids_count: 0,
          outbid_bids_count: 0,
          proxy_bids_count: 0,
          winning_bids_exposure: 0,
          proxy_bids_exposure: 0,
          maximum_potential_exposure: 0,
        };
      }

      let winningBidsCount = 0;
      let outbidBidsCount = 0;
      let winningBidsExposure = 0;

      bids.forEach((bid: any) => {
        const isWinning = bid.amount >= (bid.cars?.current_bid || 0);
        if (isWinning) {
          winningBidsCount++;
          winningBidsExposure += bid.amount;
        } else {
          outbidBidsCount++;
        }
      });

      return {
        active_bids_count: bids.length,
        winning_bids_count: winningBidsCount,
        outbid_bids_count: outbidBidsCount,
        proxy_bids_count: 0, // No proxy bids in simplified system
        winning_bids_exposure: winningBidsExposure,
        proxy_bids_exposure: 0, // No proxy bids in simplified system
        maximum_potential_exposure: winningBidsExposure,
      };
    },
    enabled: !!dealerId,
  });
};
