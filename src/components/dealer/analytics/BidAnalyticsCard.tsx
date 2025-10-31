
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BidAnalyticsData } from "./types";
import { BidSuccessRateChart } from "./BidSuccessRateChart";
import { BidAmountChart } from "./BidAmountChart";
import { BidOverTimeChart } from "./BidOverTimeChart";
import { Dices, ArrowUp, ArrowDown, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BidAnalyticsCardProps {
  analyticsData: BidAnalyticsData | null;
  isLoading: boolean;
}

export function BidAnalyticsCard({ analyticsData, isLoading }: BidAnalyticsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Place bids to see your analytics here.</p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalBids,
    successfulBids,
    outbidCount,
    averageBidAmount,
    successRate,
    marketComparison
  } = analyticsData;

  // Calculate comparison with market
  const bidAmountDiff = averageBidAmount - marketComparison.averageBidAmount;
  const successRateDiff = successRate - marketComparison.successRate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-kanit font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bid Analytics
        </CardTitle>
        <CardDescription>
          Detailed analysis of your bidding performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Dices className="h-4 w-4 mr-1" />
                  Total Bids
                </div>
                <div className="text-2xl font-bold text-primary">
                  {totalBids}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Successful Bids
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {successfulBids}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Outbid
                </div>
                <div className="text-2xl font-bold text-amber-500">
                  {outbidCount}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Average Bid
                </div>
                <div className="text-2xl font-bold">
                  ${averageBidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className={`text-xs ${bidAmountDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {bidAmountDiff >= 0 ? '↑' : '↓'} ${Math.abs(bidAmountDiff).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs. market
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Success Rate
                </div>
                <div className="text-2xl font-bold">
                  {successRate.toFixed(1)}%
                </div>
                <div className={`text-xs ${successRateDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {successRateDiff >= 0 ? '↑' : '↓'} {Math.abs(successRateDiff).toFixed(1)}% vs. market
                </div>
              </div>
            </div>
            
            <BidSuccessRateChart analyticsData={analyticsData} />
          </TabsContent>
          
          <TabsContent value="performance">
            <BidAmountChart analyticsData={analyticsData} />
          </TabsContent>
          
          <TabsContent value="trends">
            <BidOverTimeChart analyticsData={analyticsData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
