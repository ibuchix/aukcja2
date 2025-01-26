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

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const { data: bids, isLoading } = useQuery({
    queryKey: ["bids", carId],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data as Bid[];
    },
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