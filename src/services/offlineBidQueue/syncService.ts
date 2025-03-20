
import { useEffect, useState, useRef } from 'react';
import { useOnlineStatusContext } from '@/contexts/OnlineStatusContext';
import { useToast } from '@/hooks/use-toast';
import { getBidQueue, processBid, getQueuedBids, updateLastSync } from './index';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncAttempt: number | null;
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
}

export function useBidSync() {
  const { isOnline } = useOnlineStatusContext();
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAttempt: null,
    progress: {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0
    }
  });
  const isSyncingRef = useRef(false);
  const { toast } = useToast();

  // Process the bid queue when we come back online
  useEffect(() => {
    if (isOnline && !isSyncingRef.current) {
      const queuedBids = getQueuedBids();
      
      if (queuedBids.length > 0) {
        syncBids();
      }
    }
  }, [isOnline]);

  // Function to manually trigger synchronization
  const syncBids = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot sync bids",
        description: "You are currently offline. Bids will sync automatically when your connection returns.",
        variant: "destructive"
      });
      return;
    }

    if (isSyncingRef.current) {
      toast({
        title: "Sync in progress",
        description: "Bids are currently being synchronized. Please wait for the process to complete."
      });
      return;
    }

    try {
      isSyncingRef.current = true;
      const queuedBids = getQueuedBids();
      
      if (queuedBids.length === 0) {
        toast({
          title: "No bids to sync",
          description: "There are no pending bids in the queue."
        });
        return;
      }

      setStatus({
        isSyncing: true,
        lastSyncAttempt: Date.now(),
        progress: {
          total: queuedBids.length,
          processed: 0,
          successful: 0,
          failed: 0
        }
      });

      toast({
        title: "Syncing bids",
        description: `Synchronizing ${queuedBids.length} pending bid(s)...`
      });

      // Process bids in order (oldest first)
      const sortedBids = [...queuedBids].sort((a, b) => a.timestamp - b.timestamp);
      
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < sortedBids.length; i++) {
        const bid = sortedBids[i];
        const result = await processBid(bid);
        
        if (result) {
          successful++;
        } else {
          failed++;
        }

        setStatus(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            processed: i + 1,
            successful,
            failed
          }
        }));
      }

      updateLastSync();

      if (failed > 0) {
        toast({
          title: "Sync completed with issues",
          description: `Successfully processed ${successful} bid(s). ${failed} bid(s) failed to sync and will be retried later.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sync completed",
          description: `Successfully processed all ${successful} bid(s).`
        });
      }
    } catch (error) {
      console.error("Error syncing bids:", error);
      toast({
        title: "Sync error",
        description: "An unexpected error occurred while syncing bids. Please try again later.",
        variant: "destructive"
      });
    } finally {
      isSyncingRef.current = false;
      setStatus(prev => ({
        ...prev,
        isSyncing: false
      }));
    }
  };

  return {
    status,
    syncBids,
    queuedBidsCount: getQueuedBids().length
  };
}
