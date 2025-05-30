
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BidHistoryItem {
  id: string;
  amount: number;
  created_at: string;
  dealer_name?: string;
  is_proxy?: boolean;
}

export interface ChartDataPoint {
  time: string;
  amount: number;
  dealer: string;
}

export const useBidHistory = (carId: string) => {
  const [bids, setBids] = useState<BidHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
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

        // First, try to fetch bids with dealer information
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select(`
            id,
            amount,
            created_at,
            dealer_id
          `)
          .eq("car_id", carId)
          .order("created_at", { ascending: true });

        if (bidsError) {
          // Handle permission errors gracefully
          if (bidsError.code === '42501' || bidsError.message?.includes('permission')) {
            console.warn('No permission to access bids table, showing limited bid history');
            setError('Limited bid history available - full history requires authentication');
            setBids([]);
            setChartData([]);
            return;
          }
          throw bidsError;
        }

        if (!bidsData || bidsData.length === 0) {
          setBids([]);
          setChartData([]);
          return;
        }

        // Try to fetch dealer names (this might also fail due to permissions)
        const dealerIds = [...new Set(bidsData.map(bid => bid.dealer_id).filter(Boolean))];
        let dealerNames: Record<string, string> = {};

        if (dealerIds.length > 0) {
          try {
            const { data: dealersData, error: dealersError } = await supabase
              .from("dealers")
              .select("id, dealership_name")
              .in("id", dealerIds);

            if (!dealersError && dealersData) {
              dealerNames = dealersData.reduce((acc, dealer) => {
                acc[dealer.id] = dealer.dealership_name || 'Anonymous Dealer';
                return acc;
              }, {} as Record<string, string>);
            }
          } catch (dealerError) {
            console.warn('Could not fetch dealer names:', dealerError);
          }
        }

        // Try to fetch proxy bid information
        let proxyBidIds: Set<string> = new Set();
        try {
          const { data: auditData, error: auditError } = await supabase
            .from("audit_logs")
            .select("details")
            .eq("entity_id", carId)
            .eq("action", "auto_proxy_bid");

          if (!auditError && auditData) {
            auditData.forEach(log => {
              const bidId = log.details?.result?.bid_id;
              if (bidId) proxyBidIds.add(bidId);
            });
          }
        } catch (auditError) {
          console.warn('Could not fetch proxy bid information:', auditError);
        }

        // Transform bids data
        const transformedBids: BidHistoryItem[] = bidsData.map(bid => ({
          id: bid.id,
          amount: bid.amount,
          created_at: bid.created_at,
          dealer_name: bid.dealer_id ? dealerNames[bid.dealer_id] || 'Anonymous Dealer' : 'Anonymous',
          is_proxy: proxyBidIds.has(bid.id)
        }));

        // Create chart data
        const transformedChartData: ChartDataPoint[] = transformedBids.map(bid => ({
          time: new Date(bid.created_at).toLocaleTimeString(),
          amount: bid.amount,
          dealer: bid.dealer_name || 'Anonymous'
        }));

        setBids(transformedBids);
        setChartData(transformedChartData);

      } catch (err) {
        console.error("Error fetching bid history:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch bid history");
        setBids([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [carId]);

  return {
    bids,
    loading,
    error,
    chartData
  };
};
