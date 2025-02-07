import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
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

interface ProxyBidErrorsProps {
  dealerId: string;
}

export const ProxyBidErrors = ({ dealerId }: ProxyBidErrorsProps) => {
  const { data: errors, isLoading } = useQuery({
    queryKey: ["proxy-bid-errors", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proxy_bid_errors")
        .select(`
          id,
          error_type,
          error_message,
          retry_count,
          created_at,
          proxy_bids (
            car_id,
            max_bid_amount
          )
        `)
        .eq("proxy_bids.dealer_id", dealerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return null;
  }

  if (!errors?.length) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Proxy Bid Issues
        </CardTitle>
        <CardDescription>
          Review and address any issues with your proxy bids
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Error Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.id}>
                <TableCell className="font-medium">{error.error_type}</TableCell>
                <TableCell>{error.error_message}</TableCell>
                <TableCell>{error.retry_count}</TableCell>
                <TableCell>
                  {new Date(error.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};