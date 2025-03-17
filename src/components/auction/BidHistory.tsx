
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Bot } from "lucide-react";
import { format } from "date-fns";

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

interface BidHistoryProps {
  carId: string;
}

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch proxy bid audit logs
        const { data: proxyLogs, error: proxyError } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("entity_id", carId)
          .eq("action", "proxy_bid")
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
      } catch (error) {
        console.error("Error fetching bid history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchBidHistory();
    }
  }, [carId]);

  if (loading) {
    return <div className="text-center py-4">Loading bid history...</div>;
  }

  if (bids.length === 0) {
    return <div className="text-center py-4">No bids yet</div>;
  }

  return (
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {bid.is_proxy ? "Auto" : "Manual"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
