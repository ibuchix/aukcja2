
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BidAnalyticsData, BidAnalyticsFilters } from "@/components/dealer/analytics/types";
import { useCurrentDealerProfile } from "./useCurrentDealerProfile";
import { useToast } from "./use-toast";

export function useAnalyticsData(filters: BidAnalyticsFilters) {
  const [analyticsData, setAnalyticsData] = useState<BidAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { dealerProfile } = useCurrentDealerProfile();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!dealerProfile?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date range based on filter
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.dateRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        }
        
        // Fetch total bids and successful bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('id, amount, status, created_at')
          .eq('dealer_id', dealerProfile.id)
          .gte('created_at', startDate.toISOString());
          
        if (bidsError) throw bidsError;
        
        // Fetch market comparison data (all dealer bids) during same period
        const { data: marketData, error: marketError } = await supabase
          .from('bids')
          .select('amount, status')
          .gte('created_at', startDate.toISOString());
          
        if (marketError) throw marketError;
        
        // Process data
        const totalBids = bidsData.length;
        const successfulBids = bidsData.filter(bid => bid.status === 'won').length;
        const outbidCount = bidsData.filter(bid => bid.status === 'outbid').length;
        const allBidAmounts = bidsData.map(bid => bid.amount);
        const averageBidAmount = totalBids > 0 
          ? allBidAmounts.reduce((sum, amount) => sum + amount, 0) / totalBids 
          : 0;
        const highestBid = totalBids > 0 
          ? Math.max(...allBidAmounts) 
          : 0;
        const successRate = totalBids > 0 
          ? (successfulBids / totalBids) * 100 
          : 0;
          
        // Calculate market comparisons
        const marketBidAmounts = marketData.map(bid => bid.amount);
        const marketAverageBid = marketBidAmounts.length > 0 
          ? marketBidAmounts.reduce((sum, amount) => sum + amount, 0) / marketBidAmounts.length 
          : 0;
        const marketSuccessfulBids = marketData.filter(bid => bid.status === 'won').length;
        const marketSuccessRate = marketData.length > 0 
          ? (marketSuccessfulBids / marketData.length) * 100 
          : 0;
          
        // Generate bid over time data (aggregate by day)
        const bidsByDate = new Map();
        bidsData.forEach(bid => {
          const date = new Date(bid.created_at).toISOString().split('T')[0];
          if (!bidsByDate.has(date)) {
            bidsByDate.set(date, { count: 0, amount: 0 });
          }
          const current = bidsByDate.get(date);
          bidsByDate.set(date, {
            count: current.count + 1,
            amount: current.amount + bid.amount
          });
        });
        
        const bidOverTime = Array.from(bidsByDate.entries()).map(([date, data]) => ({
          date,
          count: data.count,
          amount: data.amount
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        // Get bids by status
        const statusCounts = {
          active: bidsData.filter(bid => bid.status === 'active').length,
          outbid: outbidCount,
          won: successfulBids,
          lost: bidsData.filter(bid => bid.status === 'lost').length
        };
        
        const bidsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        }));
        
        // Get data by car type
        // This is a simplified version - in a real implementation,
        // you would join with the cars table to get actual types
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('id, make, model')
          .in('id', bidsData.map(bid => bid.car_id));
          
        if (carsError) throw carsError;
        
        // Create a map of car makes
        const carMap = {};
        if (carsData) {
          carsData.forEach(car => {
            carMap[car.id] = car.make || 'Unknown';
          });
        }
        
        // Group bids by car make
        const bidsByCarType = {};
        bidsData.forEach(bid => {
          const carType = carMap[bid.car_id] || 'Unknown';
          if (!bidsByCarType[carType]) {
            bidsByCarType[carType] = {
              count: 0,
              won: 0
            };
          }
          bidsByCarType[carType].count++;
          if (bid.status === 'won') {
            bidsByCarType[carType].won++;
          }
        });
        
        const bidsByCarTypeArray = Object.entries(bidsByCarType).map(([carType, data]) => ({
          carType,
          count: data.count,
          successRate: data.count > 0 ? (data.won / data.count) * 100 : 0
        }));
        
        // Combine all data
        const processedData: BidAnalyticsData = {
          totalBids,
          successfulBids,
          outbidCount,
          averageBidAmount,
          highestBid,
          successRate,
          marketComparison: {
            averageBidAmount: marketAverageBid,
            successRate: marketSuccessRate
          },
          bidOverTime,
          bidsByStatus,
          bidsByCarType: bidsByCarTypeArray
        };
        
        setAnalyticsData(processedData);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data. Please try again later.");
        toast({
          title: "Analytics Error",
          description: "There was an error loading your analytics data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dealerProfile?.id, filters, toast]);

  return { analyticsData, isLoading, error };
}
