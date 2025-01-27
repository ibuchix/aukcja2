import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowUpDown, History } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProxyBid {
  id: string;
  car_id: string;
  max_bid_amount: number;
  created_at: string;
  updated_at: string;
  car: {
    title: string;
    auction_end_time: string;
    highest_bid: {
      amount: number;
    }[] | null;
  };
}

export const ProxyBidManagement = ({ dealerId }: { dealerId: string }) => {
  const { data: proxyBids, isLoading } = useQuery({
    queryKey: ["proxy-bids", dealerId],
    queryFn: async () => {
      const { data: proxyBids, error } = await supabase
        .from("proxy_bids")
        .select(`
          id,
          car_id,
          max_bid_amount,
          created_at,
          updated_at,
          car:cars(
            title,
            auction_end_time,
            highest_bid:bids(
              amount
            )
          )
        `)
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (proxyBids || []) as unknown as ProxyBid[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getBidStatus = (proxyBid: ProxyBid) => {
    const currentHighest = proxyBid.car.highest_bid?.[0]?.amount || 0;
    if (currentHighest === 0) return "No bids yet";
    if (currentHighest >= proxyBid.max_bid_amount) return "Outbid";
    return "Leading";
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "Leading":
        return "bg-success text-success-foreground";
      case "Outbid":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Bid Management
          </CardTitle>
        </CardHeader>
        <CardContent>Loading bids...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Bid Management
        </CardTitle>
        <CardDescription>
          Monitor and manage your automatic bids across all auctions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Max Bid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proxyBids?.map((bid) => {
              const status = getBidStatus(bid);
              const badgeColor = getBadgeColor(status);
              return (
                <TableRow key={bid.id}>
                  <TableCell>{bid.car.title}</TableCell>
                  <TableCell>${bid.max_bid_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={badgeColor}>{status}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(bid.car.auction_end_time), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(bid.updated_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              // TODO: Implement bid history view
                              console.log("View history for bid:", bid.id);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View bid history</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
            {!proxyBids?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No bids found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};