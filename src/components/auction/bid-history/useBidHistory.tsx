
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bid } from "./types";
import { isSelectQueryError, safeFilter } from "@/utils/supabaseHelpers";

// Data structure for chart
export interface ChartDataPoint {
  time: string;
  amount: number;
}

// Type guard for bid data
function isValidBid(item: any): item is {
  id: string;
  car_id: string;
  dealer_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
} {
  return item !== null && 
      typeof item === 'object' && 
      !isSelectQueryError(item) &&
      'id' in item &&
      'car_id' in item &&
      'dealer_id' in item &&
      'amount' in item &&
      'created_at' in item;
}

// Type guard for proxy log data
function isValidProxyLog(item: any): item is {
  id: string;
  entity_id: string;
  user_id: string;
  details: Record<string, any>;
  created_at: string;
} {
  return item !== null && 
      typeof item === 'object' && 
      !isSelectQueryError(item) &&
      'id' in item &&
      'entity_id' in item &&
      'user_id' in item &&
      'details' in item &&
      'created_at' in item;
}

export const useBidHistory = (carId: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        setLoading(true);
        
        // First get bids from the bids table
        const { data: bidData, error: bidError } = await supabase
          .from("bids")
          .select(`
            id,
            car_id,
            dealer_id,
            amount,
            status,
            created_at,
            updated_at
          `)
          .eq("car_id", carId)
          .order("created_at", { ascending: true });
          
        if (bidError) throw bidError;
        
        // Also get proxy bids from audit_logs if available
        const { data: proxyData, error: proxyError } = await supabase
          .from("audit_logs")
          .select(`
            id,
            entity_id,
            user_id,
            details,
            created_at
          `)
          .eq("entity_id", carId)
          .eq("action", "auto_proxy_bid")
          .order("created_at", { ascending: true });
          
        // Combine both data sources and format
        const bidHistory: Bid[] = [];
        
        // Add regular bids with type safety
        if (Array.isArray(bidData)) {
          // Filter to ensure we only process valid bid records
          const validBids = bidData.filter(isValidBid);
          
          validBids.forEach(bid => {
            bidHistory.push({
              id: bid.id,
              car_id: bid.car_id,
              dealer_id: bid.dealer_id,
              amount: bid.amount,
              status: bid.status || 'active',
              created_at: bid.created_at,
              updated_at: bid.updated_at,
              dealer_name: `Dealer ${bid.dealer_id?.substring(0, 5) || 'Unknown'}`, // Anonymized name
              is_proxy: false
            });
          });
        }
        
        // Add proxy bids with type safety
        if (Array.isArray(proxyData)) {
          // Filter to ensure we only process valid log records
          const validLogs = proxyData.filter(isValidProxyLog);
          
          validLogs.forEach(log => {
            // Additional safe check for details property
            if (log && log.details && typeof log.details === 'object') {
              const details = log.details;
              
              if (details && 'amount' in details) {
                bidHistory.push({
                  id: log.id,
                  car_id: log.entity_id,
                  dealer_id: log.user_id || '',
                  amount: Number(details.amount) || 0,
                  status: 'active',
                  created_at: log.created_at,
                  updated_at: log.created_at,
                  dealer_name: `Dealer ${(log.user_id || '').substring(0, 5)}`, // Anonymized name
                  is_proxy: true
                });
              }
            }
          });
        }
        
        // Sort combined data by timestamp
        bidHistory.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        // Create chart data
        const chartPoints: ChartDataPoint[] = bidHistory.map(bid => ({
          time: new Date(bid.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: Number(bid.amount) || 0
        }));
        
        setBids(bidHistory);
        setChartData(chartPoints);
        
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

  return { bids, loading, chartData };
};
