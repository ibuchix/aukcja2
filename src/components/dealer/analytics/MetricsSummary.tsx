import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MetricsSummaryProps = {
  metrics: {
    total_auctions: number;
    successful_auctions: number;
    average_bids: number;
    total_value: number;
  };
};

export const MetricsSummary = ({ metrics }: MetricsSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-sm">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-success">
            {metrics ? 
              `${((metrics.successful_auctions / metrics.total_auctions) * 100).toFixed(1)}%` 
              : '0%'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-sm">Average Bids</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {metrics?.average_bids.toFixed(1) || 0}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-sm">Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${metrics?.total_value.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};