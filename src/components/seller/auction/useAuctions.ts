import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AuctionFormat } from "@/types/cars";

interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
  auction_format: AuctionFormat;
  extensions_used: number;
  max_extensions_allowed: number;
  highest_bid?: {
    amount: number;
    dealer: {
      dealership_name: string;
    };
  };
  total_bids: number;
  unique_bidders: number;
}

export const useAuctions = (sellerId: string, status: 'active' | 'completed') => {
  const { toast } = useToast();

  return useQuery({
    queryKey: [`seller${status}Auctions`, sellerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          auction_format,
          extensions_used,
          max_extensions_allowed,
          highest_bid:bids(
            amount,
            dealer:dealers(dealership_name)
          ),
          total_bids:bids(count),
          unique_bidders:bids(dealer_id)
        `)
        .eq("seller_id", sellerId)
        .eq("is_auction", true)
        .eq("auction_status", status === 'active' ? "active" : status === 'completed' ? 'sold' : 'reserve_not_met')
        .order("auction_end_time", { ascending: status === 'active' });

      if (error) {
        toast({
          title: "Error loading auctions",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return auctions.map(auction => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0],
        total_bids: auction.total_bids?.length || 0,
        unique_bidders: new Set(auction.unique_bidders).size,
        auction_format: auction.auction_format as AuctionFormat
      }));
    },
  });
};