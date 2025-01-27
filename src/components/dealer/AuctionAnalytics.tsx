import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsSummary } from "./analytics/MetricsSummary";
import { BidPatternsChart } from "./analytics/BidPatternsChart";

type AuctionMetricsData = {
  total_bids: number;
  unique_bidders: number;
  final_price: number;
  duration_minutes: number;
  status: string;
};

type AuctionMetrics = {
  total_auctions: number;
  successful_auctions: number;
  average_bids: number;
  average_duration: number;
  total_value: number;
};

type BidPattern = {
  hour: number;
  bid_count: number;
};

export const AuctionAnalytics = ({ dealerId }: { dealerId: string }) => {
  const { data: metrics, isLoading: metricsLoading } = useQuery<
    AuctionMetrics,
    Error,
    AuctionMetrics,
    [string, string]
  >({
    queryKey: ["auction-metrics", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auction_metrics")
        .select("total_bids, unique_bidders, final_price, duration_minutes, status")
        .eq("dealer_id", dealerId);

      if (error) throw error;

      const metricsData = data as AuctionMetricsData[];
      
      return {
        total_auctions: metricsData.length,
        successful_auctions: metricsData.filter(d => d.status === 'sold').length,
        average_bids: metricsData.reduce((acc, curr) => acc + (curr.total_bids || 0), 0) / metricsData.length,
        average_duration: metricsData.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / metricsData.length,
        total_value: metricsData.reduce((acc, curr) => acc + (curr.final_price || 0), 0),
      };
    },
  });

  const { data: bidPatterns, isLoading: patternsLoading } = useQuery<
    BidPattern[],
    Error,
    BidPattern[],
    [string, string]
  >({
    queryKey: ["bid-patterns", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("created_at")
        .eq("dealer_id", dealerId);

      if (error) throw error;

      const hourlyDistribution: Record<number, number> = {};
      data.forEach((bid) => {
        const hour = new Date(bid.created_at).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      return Object.entries(hourlyDistribution).map(([hour, count]) => ({
        hour: parseInt(hour),
        bid_count: count,
      }));
    },
  });

  if (metricsLoading || patternsLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald">Auction Analytics</CardTitle>
        <CardDescription>
          View your auction performance and bidding patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="patterns">Bid Patterns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <MetricsSummary metrics={metrics!} />
          </TabsContent>
          
          <TabsContent value="patterns">
            <BidPatternsChart data={bidPatterns || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};