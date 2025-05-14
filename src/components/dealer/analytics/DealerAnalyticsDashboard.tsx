
import { useState } from 'react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { BidAmountChart } from './BidAmountChart';
import { BidOverTimeChart } from './BidOverTimeChart';
import { BidSuccessRateChart } from './BidSuccessRateChart';
import { BidAnalyticsDateRangePicker } from './BidAnalyticsDateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BidAnalyticsData, BidAnalyticsFilters } from './types';
import { BidAnalyticsCard } from './BidAnalyticsCard';
import { Icon } from 'lucide-react';

export const DealerAnalyticsDashboard = ({ dealerId }: { dealerId: string }) => {
  const [filters, setFilters] = useState<BidAnalyticsFilters>({
    dateRange: 'month'
  });
  
  const { metrics, loading, error } = useAnalyticsData(filters);

  // Map the metrics from useAnalyticsData to our BidAnalyticsData type
  const analyticsData: BidAnalyticsData = {
    totalBids: metrics.totalBids ?? 0,
    successfulBids: metrics.successfulBids ?? 0,
    activeBids: metrics.activeBids ?? 0,
    totalSpent: metrics.totalSpent ?? 0,
    successRate: metrics.successRate ?? 0,
    averageBidAmount: metrics.averageBid ?? 0,
    bidsByDay: metrics.bidOverTime?.map(item => ({
      date: item.date,
      count: item.count,
    })) ?? [],
    bidsByAmount: metrics.bidsByCarType?.map(item => ({
      range: item.carType,
      count: item.count,
    })) ?? [],
    bidsByStatus: {
      won: metrics.bidsByStatus?.find(s => s.status === 'won')?.count ?? 0,
      active: metrics.bidsByStatus?.find(s => s.status === 'active')?.count ?? 0,
      lost: metrics.bidsByStatus?.find(s => s.status === 'lost')?.count ?? 0,
      pending: metrics.bidsByStatus?.find(s => s.status === 'pending')?.count ?? 0
    },
    bidsByCarType: metrics.bidsByCarType ?? [],
    bidOverTime: metrics.bidOverTime ?? [],
    outbidCount: metrics.outbidCount ?? 0,
    marketComparison: metrics.marketComparison ?? {
      averageBidAmount: 0,
      successRate: 0
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Bid Analytics</h2>
        <BidAnalyticsDateRangePicker
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>Failed to load analytics data</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <BidAnalyticsCard analyticsData={analyticsData} isLoading={loading} />
  
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="success">Success Rate</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <BidAmountChart analyticsData={analyticsData} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Activity Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <BidOverTimeChart analyticsData={analyticsData} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="success" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate by Bid Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <BidSuccessRateChart analyticsData={analyticsData} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
