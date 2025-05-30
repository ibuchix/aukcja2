
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bid } from "./types";
import { 
  isValidBid, 
  isValidProxyLog,
  safeFilter,
  safelyFilterData
} from "@/utils/supabaseHelpers";

// Data structure for chart
export interface ChartDataPoint {
  time: string;
  amount: number;
}

export const useBidHistory = (carId: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchBidHistory = async () => {
      if (!carId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to get bids from the bids table with better error handling
        let bidData: any[] = [];
        try {
          const { data, error: bidError } = await supabase
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
            
          if (bidError) {
            // Handle permission errors gracefully
            if (bidError.code === '42501' || bidError.message?.includes('permission') || bidError.code === 'PGRST301') {
              console.warn('Limited access to bids table:', bidError.message);
              // Continue with empty bid data but don't fail completely
            } else {
              throw bidError;
            }
          } else {
            bidData = data || [];
          }
        } catch (bidsError) {
          console.warn('Could not fetch bid data:', bidsError);
          // Continue with empty data
        }
        
        // Try to get proxy bids from audit_logs if available
        let proxyData: any[] = [];
        try {
          const { data: auditData, error: proxyError } = await supabase
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
            
          if (!proxyError && auditData) {
            proxyData = auditData;
          }
        } catch (auditError) {
          console.warn('Could not fetch proxy bid information:', auditError);
        }
          
        // Combine both data sources and format
        const bidHistory: Bid[] = [];
        
        // Add regular bids with type safety
        if (Array.isArray(bidData)) {
          // Filter to ensure we only process valid bid records
          const validBids = safelyFilterData(bidData, isValidBid);
          
          validBids.forEach(bid => {
            bidHistory.push({
              id: bid.id,
              car_id: bid.car_id,
              dealer_id: bid.dealer_id || '',
              amount: bid.amount,
              status: bid.status || 'active',
              created_at: bid.created_at,
              updated_at: bid.updated_at || bid.created_at,
              dealer_name: `Dealer ${bid.dealer_id?.substring(0, 5) || 'Unknown'}`, // Anonymized name
              is_proxy: false
            });
          });
        }
        
        // Add proxy bids with type safety
        if (Array.isArray(proxyData)) {
          // Filter to ensure we only process valid log records
          const validLogs = safelyFilterData(proxyData, isValidProxyLog);
          
          validLogs.forEach(log => {
            // Additional safe check for details property
            if (log.details && typeof log.details === 'object') {
              const details = log.details;
              
              if ('amount' in details) {
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
        
        // If we have no data at all, show a helpful message
        if (bidHistory.length === 0) {
          setError('No bid history available for this vehicle yet');
        }
        
      } catch (error) {
        console.error("Error fetching bid history:", error);
        setError("Unable to load bid history at this time");
        setBids([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [carId]);

  return { bids, loading, error, chartData };
};
