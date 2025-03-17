
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { User, Bot } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BidHistoryProps {
  carId: string;
}

interface Bid {
  id: string;
  car_id: string;
  dealer_id: string;
  amount: number;
  created_at: string;
  is_proxy: boolean;
  dealer_name?: string;
}

export const BidHistory = ({ carId }: BidHistoryProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [proxyBids, setProxyBids] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch bid history
  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('bids')
          .select('*, dealers:dealer_id(company_name)')
          .eq('car_id', carId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        // Transform the data to include dealer_name
        const formattedBids = data.map(bid => ({
          ...bid,
          dealer_name: bid.dealers?.company_name || 'Unknown Dealer'
        }));

        setBids(formattedBids);
        
        // Check for proxy bid indicators from audit logs
        fetchProxyBidIndicators(formattedBids);
      } catch (error) {
        console.error("Error fetching bid history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProxyBidIndicators = async (bidsList: Bid[]) => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('details, created_at')
          .eq('entity_id', carId)
          .in('action', ['proxy_bid', 'auto_proxy_bid'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Create a map of bid IDs that were placed by proxy
        const proxyBidMap: Record<string, boolean> = {};
        
        if (data) {
          data.forEach(log => {
            if (log.details && typeof log.details === 'object') {
              // If the details contain a bid_id, mark that bid as a proxy bid
              const bidId = log.details.bid_id;
              if (bidId) {
                proxyBidMap[bidId.toString()] = true;
              }
            }
          });
        }
        
        setProxyBids(proxyBidMap);
      } catch (error) {
        console.error("Error fetching proxy bid indicators:", error);
      }
    };

    if (carId) {
      fetchBidHistory();
    }
  }, [carId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bid History</CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No bids have been placed yet.
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => (
              <div key={bid.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${bid.amount.toLocaleString()}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {bid.is_proxy || proxyBids[bid.id] ? (
                            <Bot size={16} className="text-blue-500" />
                          ) : (
                            <User size={16} className="text-gray-500" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {bid.is_proxy || proxyBids[bid.id] ? 
                            'Placed by automatic proxy bidding' : 
                            'Placed manually by user'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-muted-foreground">{bid.dealer_name}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
