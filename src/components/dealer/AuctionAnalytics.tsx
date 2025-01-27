import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuctionMetrics = {
  total_auctions: number;
  successful_auctions: number;
  average_bids: number;
  average_duration: number;
  total_value: number;
}

type BidPattern = {
  hour: number;
  bid_count: number;
}

export const AuctionAnalytics = ({ dealerId }: { dealerId: string }) => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["auction-metrics", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auction_metrics")
        .select(`
          total_bids,
          unique_bidders,
          final_price,
          duration_minutes,
          status
        `)
        .eq("dealer_id", dealerId);

      if (error) throw error;

      const summary: AuctionMetrics = {
        total_auctions: data.length,
        successful_auctions: data.filter(d => d.status === 'sold').length,
        average_bids: data.reduce((acc, curr) => acc + (curr.total_bids || 0), 0) / data.length,
        average_duration: data.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / data.length,
        total_value: data.reduce((acc, curr) => acc + (curr.final_price || 0), 0),
      };

      return summary;
    },
  });

  const { data: bidPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["bid-patterns", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("created_at")
        .eq("dealer_id", dealerId);

      if (error) throw error;

      const hourlyDistribution: Record<number, number> = {};
      data.forEach(bid => {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-sm">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">
                    {metrics ? 
                      `${((metrics.successful_auctions / metrics.total_auctions) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-sm">Average Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {metrics?.average_bids.toFixed(1) || 0}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-sm">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${metrics?.total_value.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="patterns">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bidPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(hour) => `Time: ${hour}:00`}
                    formatter={(value) => [`${value} bids`, "Count"]}
                  />
                  <Bar dataKey="bid_count" fill="#DC143C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};