
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Bot, TrendingUp, Clock, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Bid {
  id: string;
  car_id: string;
  dealer_id: string;
  dealer_name: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_proxy: boolean;
}

interface BidHistoryChartData {
  time: string;
  amount: number;
  bidder: string;
  isProxy: boolean;
}

interface BidHistoryProps {
  carId: string;
}

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<BidHistoryChartData[]>([]);

  useEffect(() => {
    const fetchBidHistory = async () => {
      setLoading(true);
      try {
        // Fetch regular bids
        const { data: bidData, error: bidError } = await supabase
          .from("bids")
          .select("*, dealers:dealer_id(dealership_name)")
          .eq("car_id", carId)
          .order("created_at", { ascending: false });

        if (bidError) throw bidError;

        // Fetch proxy bid audit logs - specify the action as string to avoid type issues
        const { data: proxyLogs, error: proxyError } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("entity_id", carId)
          .eq("action", "auto_proxy_bid") // Changed from "proxy_bid" to "auto_proxy_bid" which exists in the enum
          .order("created_at", { ascending: false });

        if (proxyError) throw proxyError;

        // Transform bid data
        const formattedBids = bidData.map(bid => ({
          id: bid.id,
          car_id: bid.car_id,
          dealer_id: bid.dealer_id,
          dealer_name: bid.dealers?.dealership_name || "Unknown Dealer",
          amount: bid.amount,
          status: bid.status,
          created_at: bid.created_at,
          updated_at: bid.updated_at,
          is_proxy: false // Regular bids
        }));

        // Add proxy bids from audit logs
        const proxyBids = proxyLogs.map(log => {
          // Safe access of details with type checking
          const details = log.details as Record<string, any> | null;
          const bidId = details?.bid_id || log.id;
          
          return {
            id: bidId,
            car_id: log.entity_id,
            dealer_id: log.user_id || "",
            dealer_name: "Proxy Bid", // Could fetch dealer name if needed
            amount: details?.bid_amount || 0,
            status: "proxy",
            created_at: log.created_at,
            updated_at: log.created_at,
            is_proxy: true
          };
        });

        // Combine and sort all bids
        const allBids = [...formattedBids, ...proxyBids].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setBids(allBids);

        // Prepare chart data - use oldest to newest for proper visualization
        const chartDataArray = [...allBids]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map(bid => ({
            time: format(new Date(bid.created_at), "HH:mm"),
            amount: bid.amount,
            bidder: bid.dealer_name,
            isProxy: bid.is_proxy
          }));
        
        setChartData(chartDataArray);
      } catch (error) {
        console.error("Error fetching bid history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchBidHistory();
    }

    // Set up real-time listener for new bids
    const channel = supabase
      .channel('public:bids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          const newBid = payload.new as any;
          // Format the new bid and add it to the list
          const formattedBid = {
            id: newBid.id,
            car_id: newBid.car_id,
            dealer_id: newBid.dealer_id,
            dealer_name: "New Bidder", // We don't have the dealer name from the payload
            amount: newBid.amount,
            status: newBid.status,
            created_at: newBid.created_at,
            updated_at: newBid.updated_at,
            is_proxy: false
          };
          setBids(prevBids => [formattedBid, ...prevBids]);
          
          // Update chart data
          setChartData(prevChartData => [
            ...prevChartData, 
            {
              time: format(new Date(newBid.created_at), "HH:mm"),
              amount: newBid.amount,
              bidder: "New Bidder",
              isProxy: false
            }
          ]);
        }
      )
      .subscribe();

    // Also listen for bid status changes (e.g., outbid)
    const statusChannel = supabase
      .channel('public:bids_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          const updatedBid = payload.new as any;
          // Update the bid in our list
          setBids(prevBids => prevBids.map(bid => 
            bid.id === updatedBid.id 
              ? { ...bid, status: updatedBid.status, updated_at: updatedBid.updated_at }
              : bid
          ));
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [carId]);

  const getBidStatusIcon = (bid: Bid) => {
    switch (bid.status) {
      case "active":
        return <Check size={16} className="text-green-500" />;
      case "outbid":
        return <AlertCircle size={16} className="text-amber-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading bid history...</div>;
  }

  if (bids.length === 0) {
    return <div className="text-center py-4">No bids yet</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bid History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bid Chart Visualization */}
        {chartData.length > 1 && (
          <div className="h-48 w-full">
            <ChartContainer
              config={{
                bidLine: {
                  theme: {
                    light: "#0284c7",
                    dark: "#38bdf8"
                  }
                }
              }}
            >
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="time" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      formatter={(value: any, name: any) => [
                        `$${value}`, 
                        "Bid Amount"
                      ]}
                    />
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  strokeWidth={2} 
                  name="bidLine"
                  dot={{ 
                    stroke: "#0284c7", 
                    strokeWidth: 2,
                    r: 4
                  }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
        
        <Separator />
        
        {/* List of Bids */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
          {bids.map((bid) => (
            <div key={bid.id} className="flex items-start gap-2 p-2 border-b">
              <div className="bg-muted p-2 rounded-full">
                {bid.is_proxy ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{bid.dealer_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(bid.created_at), "MMM d, HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-primary font-semibold">
                    ${bid.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    {getBidStatusIcon(bid)}
                    <Badge variant={bid.is_proxy ? "outline" : "secondary"} className="text-xs">
                      {bid.is_proxy ? "Auto" : "Manual"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
