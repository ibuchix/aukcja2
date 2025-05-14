import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidRecord, safelyFilterData } from '@/utils/supabaseHelpers';
import { BidAnalyticsFilters } from '@/components/dealer/analytics/types';

export interface BidData {
  id: string;
  car_id: string;
  dealer_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface DealerMetric {
  totalBids: number;
  activeBids: number;
  winningBids: number;
  totalSpent: number;
  totalValue: number;
  averageBid: number;
  bidsOverTime: any[];
  bidSuccessRate: number;
  successfulBids: number;
  outbidCount: number;
  highestBid: number;
  successRate: number;
  marketComparison: {
    averageBidAmount: number;
    successRate: number;
  };
  bidOverTime: {
    date: string;
    count: number;
    amount: number;
  }[];
  bidsByStatus: {
    status: string;
    count: number;
  }[];
  bidsByCarType: {
    carType: string;
    count: number;
    successRate: number;
  }[];
}

function isBidData(item: any): item is BidData {
  return (
    isValidRecord(item) &&
    'car_id' in item &&
    'dealer_id' in item &&
    'amount' in item &&
    'status' in item &&
    'created_at' in item
  );
}

export const useAnalyticsData = (filters: BidAnalyticsFilters) => {
  const [metrics, setMetrics] = useState<DealerMetric>({
    totalBids: 0,
    activeBids: 0,
    winningBids: 0,
    totalSpent: 0,
    totalValue: 0,
    averageBid: 0,
    bidsOverTime: [],
    bidSuccessRate: 0,
    successfulBids: 0,
    outbidCount: 0,
    highestBid: 0,
    successRate: 0,
    marketComparison: {
      averageBidAmount: 0,
      successRate: 0
    },
    bidOverTime: [],
    bidsByStatus: [],
    bidsByCarType: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);
        setError(null);

        // Get current user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setError("No authenticated user found");
          setLoading(false);
          return;
        }
        
        const dealerId = session.user.id;
        
        // Format date range based on filter
        let startDate = new Date();
        const endDate = new Date();
        
        switch(filters.dateRange) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            // Default to last 30 days
            startDate.setDate(endDate.getDate() - 30);
        }

        // Get all bids for this dealer within date range
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('dealer_id', dealerId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });

        if (bidsError) throw bidsError;

        // Filter to ensure we only have valid bid data
        const validBids = safelyFilterData<BidData>(bidsData || [], isBidData);

        // Mock data for demo purposes
        const mockSuccessRate = 65 + Math.random() * 15;
        const mockMarketAvg = 15000 + Math.random() * 5000;
        const mockMarketRate = 50 + Math.random() * 20;
        
        // Calculate metrics
        let totalBids = validBids.length;
        let activeBids = validBids.filter(bid => bid.status === 'active').length;
        let outbidBids = validBids.filter(bid => bid.status === 'outbid').length;
        let highestBid = validBids.reduce((max, bid) => Math.max(max, bid.amount), 0);
        let totalAmount = validBids.reduce((sum, bid) => sum + bid.amount, 0);
        let averageBid = totalBids > 0 ? totalAmount / totalBids : 0;
        let bidSuccessRate = totalBids > 0 ? (activeBids / totalBids) * 100 : 0;

        // Get bids over time (grouped by day)
        const bidsByDay: { [key: string]: { count: number, amount: number } } = {};

        validBids.forEach(bid => {
          const day = new Date(bid.created_at).toISOString().split('T')[0];
          
          if (!bidsByDay[day]) {
            bidsByDay[day] = { count: 0, amount: 0 };
          }
          
          bidsByDay[day].count += 1;
          bidsByDay[day].amount += bid.amount;
        });

        // Format data for charts
        const bidsOverTime = Object.keys(bidsByDay)
          .sort()
          .map(day => ({
            date: day,
            count: bidsByDay[day].count,
            amount: bidsByDay[day].amount,
          }));

        // Group by status
        const statusGroups: Record<string, number> = {};
        validBids.forEach(bid => {
          const status = bid.status || 'unknown';
          statusGroups[status] = (statusGroups[status] || 0) + 1;
        });
        
        const bidsByStatus = Object.entries(statusGroups).map(([status, count]) => ({
          status,
          count
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
          successfulBids: activeBids,
          outbidCount: outbidBids,
          highestBid,
          successRate: mockSuccessRate,
          marketComparison: {
            averageBidAmount: mockMarketAvg,
            successRate: mockMarketRate
          },
          bidOverTime: bidsOverTime,
          bidsByStatus,
          bidsByCarType: [
            { carType: 'Sedan', count: Math.round(totalBids * 0.4), successRate: 70 },
            { carType: 'SUV', count: Math.round(totalBids * 0.3), successRate: 65 },
            { carType: 'Truck', count: Math.round(totalBids * 0.2), successRate: 55 },
            { carType: 'Convertible', count: Math.round(totalBids * 0.1), successRate: 40 }
          ]
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [filters]);

  return { metrics, loading, error };
};
