import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuctionPromotion {
  id: string;
  auction_id: string;
  promotion_type: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_audience: {
    location?: string[];
    interests?: string[];
    dealer_types?: string[];
  };
  performance_metrics: {
    views: number;
    clicks: number;
    engagement_rate: number;
  };
}

export const useAuctionPromotions = (sellerId: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['auctionPromotions', sellerId],
    queryFn: async () => {
      const { data: promotions, error } = await supabase
        .from('auction_promotions')
        .select(`
          *,
          auction:cars(title)
        `)
        .eq('cars.seller_id', sellerId);

      if (error) {
        toast({
          title: "Error loading promotions",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return promotions;
    },
  });
};