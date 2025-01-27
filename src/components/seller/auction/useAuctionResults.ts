import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type BiddingActivity = {
  timestamp: string;
  bid_amount: number;
}

interface AuctionResult {
  id: string;
  auction_id: string;
  final_price: number;
  reserve_price: number;
  total_bids: number;
  unique_bidders: number;
  start_price: number;
  duration_minutes: number;
  bidding_activity_timeline: BiddingActivity[];
  highest_bid_dealer_id: string;
  auction: {
    title: string;
  };
}

export const useAuctionResults = (sellerId: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['auctionResults', sellerId],
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from('auction_results')
        .select(`
          *,
          auction:cars!auction_results_auction_id_fkey(title)
        `)
        .eq('cars.seller_id', sellerId);

      if (error) {
        toast({
          title: "Error loading auction results",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (!results) return [];

      // Transform the results to match our expected type
      const transformedResults = results.map(result => ({
        ...result,
        bidding_activity_timeline: (result.bidding_activity_timeline as any[] || []).map(
          (activity: any) => ({
            timestamp: activity.timestamp,
            bid_amount: activity.bid_amount
          })
        ),
        auction: {
          title: result.auction?.title || 'Untitled Auction'
        }
      }));

      return transformedResults as AuctionResult[];
    },
  });
};