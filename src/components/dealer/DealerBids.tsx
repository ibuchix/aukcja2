
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/context";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface MyBid {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    auction_end_time: string;
    current_bid: number;
    auction_status: string;
  };
  proxy_bid?: {
    max_bid_amount: number;
  };
}

export const DealerBids = () => {
  const { user } = useAuth();
  const { dealerProfile } = useCurrentDealerProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: myBids,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myBids", dealerProfile?.id],
    queryFn: async () => {
      if (!dealerProfile?.id) return [];

      const { data, error } = await supabase
        .from("bids")
        .select(`
          id,
          car_id,
          amount,
          status,
          created_at,
          car:cars(
            id,
            title,
            make,
            model,
            year,
            auction_end_time,
            current_bid,
            auction_status
          )
        `)
        .eq("dealer_id", dealerProfile.id)
        .in("status", ["active", "outbid"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get proxy bids for these cars
      const carIds = data.map((bid) => bid.car_id);
      const { data: proxyBids } = await supabase
        .from("proxy_bids")
        .select("car_id, max_bid_amount")
        .eq("dealer_id", dealerProfile.id)
        .in("car_id", carIds);

      // Merge proxy bid data
      return data.map((bid) => ({
        ...bid,
        proxy_bid: proxyBids?.find((pb) => pb.car_id === bid.car_id),
      })) as MyBid[];
    },
    enabled: !!dealerProfile?.id,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              My Bids
            </CardTitle>
            <CardDescription>
              Cars you're currently bidding on
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : myBids && myBids.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Your Bid</TableHead>
                  <TableHead>Current Bid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">
                      {bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatCurrency(bid.amount)}</span>
                        {bid.proxy_bid && (
                          <span className="text-xs text-muted-foreground">
                            Max: {formatCurrency(bid.proxy_bid.max_bid_amount)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(bid.car?.current_bid || 0)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bid.status === 'active' ? 'bg-green-100 text-green-800' : 
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {bid.status === 'active' ? 'Highest' : 'Outbid'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bid.car?.auction_end_time ? (
                        format(new Date(bid.car.auction_end_time), "MMM d, HH:mm")
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            You haven't placed any bids yet. Start bidding on vehicles to see them here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
