
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safelyFilterData } from '@/utils/supabaseHelpers';

interface BidData {
  id: string;
  car_id: string;
  dealer_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface DealerMetric {
  totalBids: number;
  activeBids: number;
  winningBids: number;
  totalSpent: number;
  totalValue: number;
  averageBid: number;
  bidsOverTime: any[];
  bidSuccessRate: number;
}

function isBidData(item: any): item is BidData {
  return (
    item !== null &&
    typeof item === 'object' &&
    'id' in item &&
    'car_id' in item &&
    'dealer_id' in item &&
    'amount' in item &&
    'status' in item &&
    'created_at' in item
  );
}

export const useAnalyticsData = (dealerId: string | undefined, dateRange: { start: Date; end: Date }) => {
  const [metrics, setMetrics] = useState<DealerMetric>({
    totalBids: 0,
    activeBids: 0,
    winningBids: 0,
    totalSpent: 0,
    totalValue: 0,
    averageBid: 0,
    bidsOverTime: [],
    bidSuccessRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!dealerId) return;

      try {
        setLoading(true);
        setError(null);

        // Format date range for query
        const startDate = dateRange.start.toISOString();
        const endDate = dateRange.end.toISOString();

        // Get all bids for this dealer within date range
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('dealer_id', dealerId)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: true });

        if (bidsError) throw bidsError;

        // Filter to ensure we only have valid bid data
        const validBids = safelyFilterData(bidsData || [], isBidData);
        
        // Calculate metrics
        let totalBids = validBids.length;
        let activeBids = validBids.filter(bid => bid.status === 'active').length;
        let outbidBids = validBids.filter(bid => bid.status === 'outbid').length;
        let totalAmount = validBids.reduce((sum, bid) => sum + bid.amount, 0);
        let averageBid = totalBids > 0 ? totalAmount / totalBids : 0;
        let bidSuccessRate = totalBids > 0 ? (activeBids / totalBids) * 100 : 0;

        // Get bids over time (grouped by day)
        const bidsByDay: { [key: string]: number } = {};
        const successByDay: { [key: string]: number } = {};

        validBids.forEach(bid => {
          const day = new Date(bid.created_at).toISOString().split('T')[0];
          
          bidsByDay[day] = (bidsByDay[day] || 0) + 1;
          
          if (bid.status === 'active') {
            successByDay[day] = (successByDay[day] || 0) + 1;
          }
        });

        // Format data for charts
        const bidsOverTime = Object.keys(bidsByDay).map(day => ({
          date: day,
          count: bidsByDay[day],
          successCount: successByDay[day] || 0,
        }));

        setMetrics({
          totalBids,
          activeBids,
          winningBids: activeBids,
          totalSpent: totalAmount,
          totalValue: totalAmount,
          averageBid,
          bidsOverTime,
          bidSuccessRate,
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dealerId, dateRange]);

  return { metrics, loading, error };
};
