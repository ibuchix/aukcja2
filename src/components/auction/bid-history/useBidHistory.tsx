
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Bid, BidHistoryChartData } from "./types";

export function useBidHistory(carId: string) {
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
          .select(`
            id, 
            car_id, 
            dealer_id, 
            amount, 
            status, 
            created_at, 
            updated_at,
            dealers:dealer_id (dealership_name)
          `)
          .eq("car_id", carId)
          .order("created_at", { ascending: false });

        if (bidError) throw bidError;

        // Fetch proxy bid audit logs
        const { data: proxyLogs, error: proxyError } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("entity_id", carId)
          .eq("action", "auto_proxy_bid")
          .order("created_at", { ascending: false });

        if (proxyError) throw proxyError;

        // Transform bid data
        const formattedBids = bidData ? bidData.map(bid => ({
          id: bid.id,
          car_id: bid.car_id,
          dealer_id: bid.dealer_id,
          dealer_name: bid.dealers?.dealership_name || "Unknown Dealer",
          amount: bid.amount,
          status: bid.status,
          created_at: bid.created_at,
          updated_at: bid.updated_at,
          is_proxy: false
        })) : [];

        // Add proxy bids from audit logs
        const proxyBids = proxyLogs ? proxyLogs.map(log => {
          const details = log.details as Record<string, any> | null;
          const bidId = details?.bid_id || log.id;
          
          return {
            id: bidId,
            car_id: log.entity_id || "",
            dealer_id: log.user_id || "",
            dealer_name: "Proxy Bid",
            amount: details?.bid_amount || 0,
            status: "proxy",
            created_at: log.created_at || "",
            updated_at: log.created_at || "",
            is_proxy: true
          };
        }) : [];

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

  return { bids, loading, chartData };
}
