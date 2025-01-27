import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuctionResult {
  id: string;
  auction_id: string;
  final_price: number;
  reserve_price: number;
  total_bids: number;
  unique_bidders: number;
  start_price: number;
  duration_minutes: number;
  bidding_activity_timeline: {
    timestamp: string;
    bid_amount: number;
  }[];
  highest_bid_dealer_id: string;
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
          auction:cars(title)
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

      return results;
    },
  });
};