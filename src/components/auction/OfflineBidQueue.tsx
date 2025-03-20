
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ListChecks, Wifi, WifiOff } from "lucide-react";
import { QueuedBid } from "@/services/offlineBidQueue/types";
import { getQueuedBids, getQueuedBidsCount } from "@/services/offlineBidQueue/bidQueueManager";
import { processBids } from "@/services/offlineBidQueue/syncService";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const OfflineBidQueue: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [queuedBids, setQueuedBids] = useState<QueuedBid[]>([]);
  const { isOnline } = useOnlineStatusContext();
  const { toast } = useToast();
  const queueCount = getQueuedBidsCount();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Refresh the list when opening
      setQueuedBids(getQueuedBids());
    }
    setOpen(isOpen);
  };

  const handleProcessQueue = async () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Cannot process bids while offline",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await processBids();
      
      if (result.success > 0) {
        toast({
          title: "Bids processed",
          description: `Successfully processed ${result.success} bids. Failed: ${result.failed}`,
        });
      } else if (result.failed > 0) {
        toast({
          title: "Processing failed",
          description: `Failed to process ${result.failed} bids`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No bids to process",
          description: "Your bid queue is empty",
        });
      }
      
      // Refresh the list
      setQueuedBids(getQueuedBids());
    } catch (error) {
      console.error("Error processing bids:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your bids",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative"
          onClick={() => setQueuedBids(getQueuedBids())}
        >
          <ListChecks className="h-4 w-4 mr-2" />
          Bid Queue
          {queueCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {queueCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Offline Bid Queue</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <Button 
            onClick={handleProcessQueue} 
            disabled={!isOnline || queuedBids.length === 0}
            className="w-full mb-4"
          >
            Process All Bids
          </Button>
          
          {queuedBids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending bids in the queue
            </div>
          ) : (
            <div className="space-y-3">
              {queuedBids.map(bid => (
                <div key={bid.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={bid.type === 'standard' ? 'outline' : 'secondary'}>
                      {bid.type === 'standard' ? 'Standard Bid' : 'Proxy Bid'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-medium">${bid.amount.toLocaleString()}</p>
                  {bid.type === 'proxy' && bid.maxProxyAmount && (
                    <p className="text-sm text-muted-foreground">
                      Max Proxy: ${bid.maxProxyAmount.toLocaleString()}
                    </p>
                  )}
                  {bid.attempts > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Attempted: {bid.attempts} time{bid.attempts !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
