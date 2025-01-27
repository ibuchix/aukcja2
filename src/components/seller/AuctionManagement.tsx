import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Gavel, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AuctionFormat } from "@/types/cars";
import { AuctionTimer } from "@/components/auction/AuctionTimer";

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

export const SellerAuctionManagement = ({ sellerId }: { sellerId: string }) => {
  const { toast } = useToast();

  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["sellerActiveAuctions", sellerId],
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
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true });

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

  const { data: completedAuctions, isLoading: loadingCompleted } = useQuery({
    queryKey: ["sellerCompletedAuctions", sellerId],
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
        .in("auction_status", ["sold", "reserve_not_met"])
        .order("auction_end_time", { ascending: false });

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

  const renderAuctionTable = (auctions: Auction[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return <div className="text-muted-foreground">Loading auctions...</div>;
    }

    if (!auctions?.length) {
      return <div className="text-muted-foreground">No auctions found.</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Time Remaining</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Extensions</TableHead>
            <TableHead>Reserve Price</TableHead>
            <TableHead>Highest Bid</TableHead>
            <TableHead>Total Bids</TableHead>
            <TableHead>Unique Bidders</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell>{auction.title}</TableCell>
              <TableCell>
                <AuctionTimer 
                  auctionEndTime={auction.auction_end_time}
                  auctionFormat={auction.auction_format}
                  extensionsUsed={auction.extensions_used}
                  maxExtensionsAllowed={auction.max_extensions_allowed}
                />
              </TableCell>
              <TableCell className="capitalize">
                {auction.auction_format}
              </TableCell>
              <TableCell>
                {auction.auction_format === 'extended' ? (
                  <div className="space-y-1">
                    <div>{auction.extensions_used}/{auction.max_extensions_allowed} used</div>
                    {auction.extensions_used < auction.max_extensions_allowed && (
                      <div className="text-sm text-muted-foreground">
                        Extensions available
                      </div>
                    )}
                  </div>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>${auction.reserve_price.toLocaleString()}</TableCell>
              <TableCell>
                {auction.highest_bid ? (
                  <div className="space-y-1">
                    <div>${auction.highest_bid.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      by {auction.highest_bid.dealer.dealership_name}
                    </div>
                  </div>
                ) : (
                  "No bids"
                )}
              </TableCell>
              <TableCell>{auction.total_bids}</TableCell>
              <TableCell>{auction.unique_bidders}</TableCell>
              <TableCell className="capitalize">
                {auction.auction_status === "sold" ? (
                  <span className="text-success font-medium">Sold</span>
                ) : auction.auction_status === "reserve_not_met" ? (
                  <span className="text-destructive font-medium">Reserve not met</span>
                ) : (
                  auction.auction_status
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          Auction Management
        </CardTitle>
        <CardDescription>
          Monitor your active auctions and view auction results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Active Auctions
            </TabsTrigger>
            <TabsTrigger value="completed">Completed Auctions</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {renderAuctionTable(activeAuctions, loadingActive)}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {renderAuctionTable(completedAuctions, loadingCompleted)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};