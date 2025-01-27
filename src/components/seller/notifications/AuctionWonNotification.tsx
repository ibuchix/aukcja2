import { Bell, Car, CheckCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WonAuction {
  id: string;
  title: string;
  final_price: number;
  dealer: {
    dealership_name: string;
  };
}

export const AuctionWonNotification = ({ sellerId }: { sellerId: string }) => {
  const { data: wonAuctions } = useQuery({
    queryKey: ['wonAuctions', sellerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from('cars')
        .select(`
          id,
          title,
          auction_results!inner (
            final_price,
            dealer:dealers!inner(dealership_name)
          )
        `)
        .eq('seller_id', sellerId)
        .eq('auction_status', 'sold')
        .order('auction_end_time', { ascending: false });

      if (error) throw error;
      
      return auctions.map(auction => ({
        id: auction.id,
        title: auction.title,
        final_price: auction.auction_results[0].final_price,
        dealer: auction.auction_results[0].dealer
      })) as WonAuction[];
    },
  });

  if (!wonAuctions?.length) return null;

  return (
    <div className="space-y-4 mb-6">
      {wonAuctions.map((auction) => (
        <Alert key={auction.id}>
          <Bell className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2 text-heading-md font-oswald">
            <Car className="h-5 w-5" />
            Auction Won: {auction.title}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              Congratulations! {auction.dealer.dealership_name} has won the auction for £{auction.final_price.toLocaleString()}.
            </p>
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Next steps:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Ensure all vehicle documentation is ready
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Clean and prepare the vehicle for handover
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Await contact from the dealer for collection arrangements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Have keys and all promised accessories ready
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};