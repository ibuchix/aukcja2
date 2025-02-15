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

interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
  highest_bid?: {
    amount: number;
    dealer_id: string;
  };
  my_bid?: {
    amount: number;
    status: string;
  };
}

export const AuctionManagement = ({ dealerId }: { dealerId: string }) => {
  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["activeAuctions", dealerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          highest_bid:bids(amount, dealer_id)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      // Get dealer's bids for these auctions
      const auctionIds = auctions.map((a) => a.id);
      const { data: dealerBids } = await supabase
        .from("bids")
        .select("car_id, amount, status")
        .eq("dealer_id", dealerId)
        .in("car_id", auctionIds);

      return auctions.map((auction) => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0],
        my_bid: dealerBids?.find((bid) => bid.car_id === auction.id),
      }));
    },
  });

  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ["wonAuctions", dealerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          highest_bid:bids(amount, dealer_id)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "sold")
        .in("id", 
          supabase
            .from("bids")
            .select("car_id")
            .eq("dealer_id", dealerId)
            .eq("status", "won")
        )
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      return auctions;
    },
  });

  const { data: lostAuctions, isLoading: loadingLost } = useQuery({
    queryKey: ["lostAuctions", dealerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          highest_bid:bids(amount, dealer_id),
          my_bid:bids!inner(amount, status)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "sold")
        .eq("bids.dealer_id", dealerId)
        .eq("bids.status", "lost")
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      return auctions.map(auction => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0],
        my_bid: auction.my_bid?.[0],
        lost_by: auction.highest_bid?.[0]?.amount - auction.my_bid?.[0]?.amount
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
            <TableHead>End Time</TableHead>
            <TableHead>Reserve Price</TableHead>
            <TableHead>Highest Bid</TableHead>
            <TableHead>My Bid</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell>{auction.title}</TableCell>
              <TableCell>
                {format(new Date(auction.auction_end_time), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>${auction.reserve_price.toLocaleString()}</TableCell>
              <TableCell>
                {auction.highest_bid ? (
                  <span className={auction.highest_bid.dealer_id === dealerId ? "text-success font-medium" : ""}>
                    ${auction.highest_bid.amount.toLocaleString()}
                  </span>
                ) : (
                  "No bids"
                )}
              </TableCell>
              <TableCell>
                {auction.my_bid ? (
                  <span className={auction.my_bid.status === "winning" ? "text-success font-medium" : ""}>
                    ${auction.my_bid.amount.toLocaleString()}
                  </span>
                ) : (
                  "No bid"
                )}
              </TableCell>
              <TableCell className="capitalize">
                {auction.auction_status === "sold" ? (
                  <span className="text-success font-medium">Sold</span>
                ) : auction.auction_status === "reserve_not_met" ? (
                  <span className="text-destructive font-medium">Reserve not met</span>
                ) : (
                  auction.auction_status
                )}
                {auction.lost_by && (
                  <div className="text-sm text-muted-foreground">
                    Lost by ${auction.lost_by.toLocaleString()}
                  </div>
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
            <TabsTrigger value="won">Won Auctions</TabsTrigger>
            <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {renderAuctionTable(activeAuctions, loadingActive)}
          </TabsContent>
          <TabsContent value="won" className="mt-4">
            {renderAuctionTable(wonAuctions, loadingWon)}
          </TabsContent>
          <TabsContent value="lost" className="mt-4">
            {renderAuctionTable(lostAuctions, loadingLost)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
