
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Loader2, QueueList, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";
import { getQueuedBids, clearBidQueue, QueuedBid } from "@/services/offlineBidQueue";
import { useBidSync } from "@/services/offlineBidQueue/syncService";

export function OfflineBidQueue() {
  const [queuedBids, setQueuedBids] = useState<QueuedBid[]>([]);
  const { isOnline } = useOnlineStatusContext();
  const { status, syncBids } = useBidSync();
  
  // Load queued bids on mount and when status changes
  useEffect(() => {
    setQueuedBids(getQueuedBids());
    
    // Set up interval to refresh the queue
    const interval = setInterval(() => {
      setQueuedBids(getQueuedBids());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [status.isSyncing]);
  
  // Format timestamp to readable date
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const handleClearQueue = () => {
    if (window.confirm("Are you sure you want to clear all queued bids? This action cannot be undone.")) {
      clearBidQueue();
      setQueuedBids([]);
    }
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <QueueList className="mr-2 h-4 w-4" />
          Queued Bids
          {queuedBids.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2">
              {queuedBids.length}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Offline Bid Queue</DrawerTitle>
            <DrawerDescription>
              Bids placed while offline will be submitted when you're back online.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {status.isSyncing && (
              <div className="mb-4 p-2 border rounded bg-yellow-50">
                <p className="flex items-center text-sm text-yellow-700">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing bids... ({status.progress.processed}/{status.progress.total})
                </p>
              </div>
            )}
            
            {queuedBids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No bids in queue</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queuedBids.map((bid) => (
                  <div key={bid.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {bid.type === 'standard' 
                            ? `Standard Bid: ${formatCurrency(bid.amount)}` 
                            : `Proxy Bid: ${formatCurrency(bid.maxProxyAmount || 0)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Car ID: {bid.carId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Queued: {formatTime(bid.timestamp)}
                        </p>
                        {bid.lastAttempt && (
                          <p className="text-xs text-muted-foreground">
                            Last attempt: {formatTime(bid.lastAttempt)} (Attempts: {bid.attempts})
                          </p>
                        )}
                      </div>
                      <Badge variant={bid.type === 'standard' ? "default" : "outline"}>
                        {bid.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DrawerFooter className="flex-row justify-between">
            <Button 
              variant="destructive" 
              onClick={handleClearQueue}
              disabled={queuedBids.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                onClick={syncBids}
                disabled={!isOnline || status.isSyncing || queuedBids.length === 0}
              >
                {status.isSyncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sync Now
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
