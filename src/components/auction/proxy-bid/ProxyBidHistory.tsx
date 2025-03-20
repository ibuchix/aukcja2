
import { Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProxyBidHistory } from "./useProxyBidHistory";
import type { ProxyBidHistoryItem as ProxyBidHistoryItemType } from "./useProxyBidHistory";
import { formatCurrency } from "@/lib/utils";

interface ProxyBidHistoryProps {
  carId: string;
  dealerId: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const ProxyBidHistoryItem = ({ item }: { item: ProxyBidHistoryItemType }) => {
  return (
    <div className="py-3 border-b last:border-0 flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm font-medium">
          <DollarSign className="h-4 w-4 mr-1 text-primary" />
          Maximum Bid: {formatCurrency(item.max_bid_amount)}
        </div>
        <span className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(item.created_at)}
        </span>
      </div>
      {item.last_processed_amount && (
        <div className="text-xs text-muted-foreground">
          Used for automatic bid: {formatCurrency(item.last_processed_amount)}
        </div>
      )}
    </div>
  );
};

export const ProxyBidHistory = ({ carId, dealerId }: ProxyBidHistoryProps) => {
  const { history, isLoading, error } = useProxyBidHistory({ carId, dealerId });

  // Only show component if there's history to display
  if (!isLoading && history.length === 0) return null;

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Proxy Bid History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse py-4">Loading history...</div>
        ) : error ? (
          <div className="text-sm text-red-500 py-2">{error}</div>
        ) : (
          <div className="divide-y">
            {history.map((item) => (
              <ProxyBidHistoryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
