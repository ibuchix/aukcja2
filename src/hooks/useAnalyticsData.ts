
import { useState, useEffect } from "react";
import { BidAnalyticsData, BidAnalyticsFilters } from "@/components/dealer/analytics/types";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { supabase } from "@/integrations/supabase/client";

export function useAnalyticsData(filters: BidAnalyticsFilters = { dateRange: 'month' }) {
  const { dealerProfile } = useCurrentDealerProfile();
  const [analyticsData, setAnalyticsData] = useState<BidAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyticsData() {
      if (!dealerProfile?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch dealer's bid data
        const { data: bids, error: bidsError } = await supabase
          .from("bids")
          .select(`
            id,
            amount,
            status,
            created_at,
            car_id,
            car:cars(make, model, year)
          `)
          .eq("dealer_id", dealerProfile.id)
          .order("created_at", { ascending: false });

        if (bidsError) throw bidsError;

        // Filter based on date range
        const filteredBids = filterBidsByDateRange(bids, filters.dateRange);

        // Fetch market data for comparison
        const { data: marketBids, error: marketError } = await supabase
          .from("bids")
          .select(`
            amount,
            status
          `)
          .neq("dealer_id", dealerProfile.id);

        if (marketError) throw marketError;

        // Calculate analytics
        const totalBids = filteredBids.length;
        const successfulBids = filteredBids.filter(bid => bid.status === 'won').length;
        const outbidCount = filteredBids.filter(bid => bid.status === 'outbid').length;
        const bidAmounts = filteredBids.map(bid => bid.amount || 0);
        const averageBidAmount = bidAmounts.length > 0 
          ? bidAmounts.reduce((sum, amount) => sum + amount, 0) / bidAmounts.length 
          : 0;
        const highestBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0;
        const successRate = totalBids > 0 ? (successfulBids / totalBids) * 100 : 0;

        // Market comparisons
        const marketBidAmounts = marketBids.map(bid => bid.amount || 0);
        const marketAvgBid = marketBidAmounts.length > 0 
          ? marketBidAmounts.reduce((sum, amount) => sum + amount, 0) / marketBidAmounts.length 
          : 0;
        const marketSuccessRate = marketBids.length > 0 
          ? (marketBids.filter(bid => bid.status === 'won').length / marketBids.length) * 100 
          : 0;

        // Prepare time series data
        const bidOverTime = prepareBidTimeSeriesData(filteredBids);

        // Status distribution
        const statusCounts = countBidsByStatus(filteredBids);

        // Car type analytics
        const carTypeAnalytics = analyzeCarTypes(filteredBids);

        setAnalyticsData({
          totalBids,
          successfulBids,
          outbidCount,
          averageBidAmount,
          highestBid,
          successRate,
          marketComparison: {
            averageBidAmount: marketAvgBid,
            successRate: marketSuccessRate
          },
          bidOverTime,
          bidsByStatus: statusCounts,
          bidsByCarType: carTypeAnalytics
        });

      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [dealerProfile?.id, filters]);

  return { analyticsData, isLoading, error };
}

// Helper functions
function filterBidsByDateRange(bids: any[], dateRange: string) {
  const now = new Date();
  let compareDate = new Date();

  switch (dateRange) {
    case 'week':
      compareDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      compareDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      compareDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      compareDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      compareDate = new Date(0); // Beginning of time
      break;
  }

  return bids.filter(bid => new Date(bid.created_at) >= compareDate);
}

function prepareBidTimeSeriesData(bids: any[]) {
  // Group bids by date
  const bidsByDate = bids.reduce((acc: Record<string, any>, bid) => {
    const date = new Date(bid.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { count: 0, amount: 0 };
    }
    acc[date].count += 1;
    acc[date].amount += bid.amount || 0;
    return acc;
  }, {});

  // Convert to array format
  return Object.entries(bidsByDate).map(([date, data]: [string, any]) => ({
    date,
    count: data.count,
    amount: data.amount / data.count // Average amount for the day
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function countBidsByStatus(bids: any[]) {
  const statusCounts: Record<string, number> = {};
  
  bids.forEach(bid => {
    const status = bid.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));
}

function analyzeCarTypes(bids: any[]) {
  const carTypeMap: Record<string, { count: number, won: number, total: number }> = {};

  bids.forEach(bid => {
    const car = bid.car || {};
    const carType = `${car.make || 'Unknown'} ${car.model || ''}`.trim();
    
    if (!carTypeMap[carType]) {
      carTypeMap[carType] = { count: 0, won: 0, total: 0 };
    }
    
    carTypeMap[carType].count += 1;
    carTypeMap[carType].total += bid.amount || 0;
    if (bid.status === 'won') {
      carTypeMap[carType].won += 1;
    }
  });

  return Object.entries(carTypeMap).map(([carType, data]) => ({
    carType,
    count: data.count,
    successRate: data.count > 0 ? (data.won / data.count) * 100 : 0
  }));
}
