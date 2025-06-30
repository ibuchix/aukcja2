
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuctionStatusMonitorProps {
  onAuctionEnded?: (carId: string, finalStatus: string) => void;
  onAuctionStarted?: (carId: string) => void;
}

export const useAuctionStatusMonitor = ({ 
  onAuctionEnded, 
  onAuctionStarted 
}: AuctionStatusMonitorProps = {}) => {
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Create a channel to listen for auction schedule changes
    channelRef.current = supabase
      .channel('auction_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction_schedules'
        },
        (payload) => {
          console.log('Auction schedule updated:', payload);
          
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          const carId = payload.new?.car_id;
          
          if (oldStatus !== newStatus && carId) {
            if (newStatus === 'running' && oldStatus === 'scheduled') {
              toast({
                title: "Auction Started",
                description: "An auction you're watching has just started!",
                duration: 5000,
              });
              onAuctionStarted?.(carId);
            } else if (newStatus === 'completed' && oldStatus === 'running') {
              toast({
                title: "Auction Ended",
                description: "An auction has ended. Check the results!",
                duration: 5000,
              });
              onAuctionEnded?.(carId, 'ended');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars'
        },
        (payload) => {
          console.log('Car auction status updated:', payload);
          
          const newAuctionStatus = payload.new?.auction_status;
          const oldAuctionStatus = payload.old?.auction_status;
          const carId = payload.new?.id;
          
          if (oldAuctionStatus !== newAuctionStatus && carId) {
            if (newAuctionStatus === 'sold') {
              toast({
                title: "Auction Sold!",
                description: "A vehicle has been sold at auction.",
                duration: 5000,
              });
              onAuctionEnded?.(carId, 'sold');
            } else if (newAuctionStatus === 'ended') {
              toast({
                title: "Auction Ended",
                description: "An auction has ended without sale.",
                duration: 5000,
              });
              onAuctionEnded?.(carId, 'ended');
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [onAuctionEnded, onAuctionStarted, toast]);

  // Function to manually trigger status update via edge function
  const triggerStatusUpdate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('update-auction-outcomes', {
        body: { trigger: 'manual' }
      });
      
      if (error) {
        console.error('Error triggering status update:', error);
        toast({
          title: "Error",
          description: "Failed to update auction statuses",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Manual status update result:', data);
      toast({
        title: "Status Updated",
        description: "Auction statuses have been refreshed",
      });
      
      return data;
    } catch (error) {
      console.error('Error in manual status update:', error);
      toast({
        title: "Error",
        description: "Failed to update auction statuses",
        variant: "destructive",
      });
    }
  };

  return { triggerStatusUpdate };
};
