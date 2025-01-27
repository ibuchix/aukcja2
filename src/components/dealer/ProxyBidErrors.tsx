import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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

interface ProxyBidError {
  id: string;
  error_type: string;
  error_message: string;
  retry_count: number;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  metadata: {
    auction_status: string;
    current_highest_bid: number;
    attempted_amount?: number;
  };
}

export const ProxyBidErrors = ({ dealerId }: { dealerId: string }) => {
  const { data: errors, isLoading } = useQuery({
    queryKey: ["proxyBidErrors", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proxy_bid_errors")
        .select(`
          *,
          proxy_bids!inner(dealer_id)
        `)
        .eq("proxy_bids.dealer_id", dealerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProxyBidError[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-subtitle-text">Loading error logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (!errors?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <p>No proxy bid errors found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Proxy Bid Error Logs
        </CardTitle>
        <CardDescription>
          Monitor and track any issues with your proxy bids
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Error Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.id}>
                <TableCell className="font-medium">{error.error_type}</TableCell>
                <TableCell>{error.error_message}</TableCell>
                <TableCell>{error.retry_count}</TableCell>
                <TableCell>
                  {error.resolved ? (
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive">
                      Unresolved
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(error.created_at), "MMM d, yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};