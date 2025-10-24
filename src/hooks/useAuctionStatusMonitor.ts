
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
            if (newStatus === 'active' && oldStatus === 'scheduled') {
              onAuctionStarted?.(carId);
            } else if (newStatus === 'completed' && oldStatus === 'active') {
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
              onAuctionEnded?.(carId, 'sold');
            } else if (newAuctionStatus === 'ended') {
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
      // Call the auction processing function directly
      const { data, error } = await supabase.rpc('process_ended_auctions');
      
      if (error) {
        console.error('Error triggering status update:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się zaktualizować statusów aukcji",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Manual status update result:', data);
      
      // Type-safe access to response data
      const response = data as any;
      toast({
        title: "Status zaktualizowany",
        description: `Przetworzono ${response?.processed_count || 0} aukcji`,
      });
      
      return data;
    } catch (error) {
      console.error('Error in manual status update:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusów aukcji",
        variant: "destructive",
      });
    }
  };

  return { triggerStatusUpdate };
};
