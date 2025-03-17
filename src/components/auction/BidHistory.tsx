
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBidHistory } from "./bid-history/useBidHistory";
import { BidHistoryList } from "./bid-history/BidHistoryList";
import { BidChart } from "./bid-history/BidChart";

interface BidHistoryProps {
  carId: string;
}

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const { bids, loading, chartData } = useBidHistory(carId);

  if (loading) {
    return <div className="text-center py-4">Loading bid history...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bid History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bid Chart Visualization */}
        <BidChart chartData={chartData} />
        
        <Separator />
        
        {/* List of Bids */}
        <BidHistoryList bids={bids} />
      </CardContent>
    </Card>
  );
};
