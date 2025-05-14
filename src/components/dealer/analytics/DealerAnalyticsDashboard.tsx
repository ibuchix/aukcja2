
import { useState } from 'react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { BidAnalyticsCard } from './BidAnalyticsCard';
import { BidAmountChart } from './BidAmountChart';
import { BidOverTimeChart } from './BidOverTimeChart';
import { BidSuccessRateChart } from './BidSuccessRateChart';
import { BidAnalyticsDateRangePicker } from './BidAnalyticsDateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BidAnalyticsData } from './types';

export const DealerAnalyticsDashboard = ({ dealerId }: { dealerId: string }) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  
  const { metrics, loading, error } = useAnalyticsData(dealerId, dateRange);

  const analyticsData: BidAnalyticsData = {
    totalBids: metrics.totalBids ?? 0,
    successfulBids: metrics.successfulBids ?? 0,
    activeBids: metrics.activeBids ?? 0,
    totalSpent: metrics.totalSpent ?? 0,
    successRate: metrics.successRate ?? 0,
    averageBidAmount: metrics.averageBidAmount ?? 0,
    bidsByDay: metrics.bidsByDay ?? [],
    bidsByAmount: metrics.bidsByAmount ?? [],
    bidsByStatus: metrics.bidsByStatus ?? { won: 0, active: 0, lost: 0, pending: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Bid Analytics</h2>
        <BidAnalyticsDateRangePicker
          onChange={(range) => setDateRange(range)}
          currentRange={dateRange}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BidAnalyticsCard
              title="Total Bids"
              value={analyticsData.totalBids}
              description="Total number of bids placed"
              icon="activity"
            />
            <BidAnalyticsCard
              title="Success Rate"
              value={`${analyticsData.successRate.toFixed(1)}%`}
              description="Percentage of winning bids"
              icon="percent"
            />
            <BidAnalyticsCard
              title="Average Bid"
              value={`$${analyticsData.averageBidAmount.toLocaleString()}`}
              description="Average amount per bid"
              icon="trending-up"
            />
          </div>

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
                  <BidAmountChart data={analyticsData.bidsByAmount} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Activity Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <BidOverTimeChart data={analyticsData.bidsByDay} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="success" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate by Bid Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <BidSuccessRateChart data={analyticsData.bidsByStatus} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
