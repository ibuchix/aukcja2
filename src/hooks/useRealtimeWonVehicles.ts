import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WonVehicle {
  id: string;
  car_id: string;
  auction_end_time: string;
  winning_bid_amount: number;
  payment_status: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  created_at: string;
  updated_at: string;
}

export const useRealtimeWonVehicles = (onNewWonVehicle?: (vehicle: WonVehicle) => void) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsListening(true);

    // Set up real-time subscription for new won vehicles
    const channel = supabase
      .channel('won-vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dealer_won_vehicles'
        },
        (payload) => {
          console.log('New won vehicle received:', payload);
          
          const newWonVehicle = payload.new as WonVehicle;
          
          // Toast: Congratulations - Dealer won an auction
          toast({
            description: `Wygrałeś aukcję ${newWonVehicle.vehicle_year} ${newWonVehicle.vehicle_make} ${newWonVehicle.vehicle_model}! 🎉`,
            variant: "default",
            duration: 8000,
          });

          // Call callback if provided
          if (onNewWonVehicle) {
            onNewWonVehicle(newWonVehicle);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dealer_won_vehicles'
        },
        (payload) => {
          console.log('Won vehicle updated:', payload);
          
          const updatedVehicle = payload.new as WonVehicle;
          const oldVehicle = payload.old as WonVehicle;
          
          // Check if payment status changed
          if (oldVehicle.payment_status !== updatedVehicle.payment_status) {
            if (updatedVehicle.payment_status === 'payment_required') {
              // Toast: Seller Decision Update - Seller accepted bid, payment now required
              toast({
                description: `Sprzedawca zaakceptował Twoją ofertę na ${updatedVehicle.vehicle_year} ${updatedVehicle.vehicle_make} ${updatedVehicle.vehicle_model}. Możesz teraz przejść do płatności.`,
                variant: "default",
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Won vehicles realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up won vehicles realtime subscription');
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [toast, onNewWonVehicle]);

  return { isListening };
};