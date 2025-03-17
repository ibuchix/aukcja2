
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/integrations/supabase/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DatabaseBid = Database['public']['Tables']['bids']['Row'] & {
  dealer: {
    dealership_name: string | null;
  } | null;
};

interface BidHistoryProps {
  carId: string;
}

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  dealer: {
    dealership_name: string;
  };
  status: string;
  is_proxy: boolean;
}

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const { data: bids, isLoading } = useQuery({
    queryKey: ["auction-bids", carId],
    queryFn: async () => {
      try {
        // Try to get cached auction details
        const { data, error } = await supabase.functions.invoke('auction-cache', {
          body: { action: 'getAuctionDetails', carId }
        });

        if (error) throw error;
        return data.bids as Bid[];
      } catch (error) {
        console.error('Cache fetch failed, falling back to direct query:', error);
        
        // Use explicit string literal for equality check
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select(`
            id,
            amount,
            created_at,
            status,
            dealer:dealers(dealership_name)
          `)
          .eq("car_id", carId as string);

        if (bidsError) throw bidsError;
        
        if (!bidsData) return [];

        // Query the audit logs to see which bids were made by proxy
        const { data: proxyBidLogs } = await supabase
          .from("audit_logs")
          .select('details')
          .eq('entity_type', 'car')
          .eq('entity_id', carId)
          .eq('action', 'proxy_bid');

        // Create a Set of bid IDs that were made by proxy
        const proxyBidIds = new Set(
          proxyBidLogs
            ?.filter(log => log.details && log.details.bid_id)
            .map(log => log.details.bid_id) || []
        );
        
        // Transform the data to match the Bid interface
        return bidsData.map((bid: any) => ({
          id: bid.id,
          amount: bid.amount,
          created_at: bid.created_at,
          status: bid.status,
          is_proxy: proxyBidIds.has(bid.id),
          dealer: {
            dealership_name: bid.dealer?.dealership_name || 'Unknown Dealer'
          }
        })) as Bid[];
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <History className="h-5 w-5" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>Loading bid history...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <History className="h-5 w-5" />
          Bid History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dealer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids?.map((bid) => (
              <TableRow key={bid.id}>
                <TableCell>{bid.dealer.dealership_name}</TableCell>
                <TableCell>${bid.amount.toLocaleString()}</TableCell>
                <TableCell>
                  {format(new Date(bid.created_at), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {bid.status === "winning" ? (
                    <span className="text-success font-medium">Winning</span>
                  ) : (
                    bid.status
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {bid.is_proxy ? (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Bot className="h-4 w-4" /> Auto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <User className="h-4 w-4" /> Manual
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {bid.is_proxy ? 
                          "This bid was automatically placed by the proxy bidding system" : 
                          "This bid was manually placed by the dealer"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
