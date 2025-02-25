
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
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
}

interface BidResponse {
  id: string;
  amount: number;
  created_at: string;
  status: string;
  dealer: {
    dealership_name: string | null;
  } | null;
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
        
        // Fallback to direct database query
        const { data, error: dbError } = await supabase
          .from("bids")
          .select(`
            id,
            amount,
            created_at,
            status,
            dealer:dealers(dealership_name)
          `)
          .eq("car_id", carId)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        
        if (!data) return [];

        // Transform the data to match the Bid interface
        return (data as BidResponse[]).map(bid => ({
          id: bid.id,
          amount: bid.amount,
          created_at: bid.created_at,
          status: bid.status,
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
