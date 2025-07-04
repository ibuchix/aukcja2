import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentDealerProfile } from '@/hooks/useCurrentDealerProfile';

interface DealerStats {
  activeBids: number;
  wonAuctions: number;
  availableAuctions: number;
  loading: boolean;
  error: string | null;
}

export const useDealerStats = () => {
  const { dealerProfile } = useCurrentDealerProfile();
  const [stats, setStats] = useState<DealerStats>({
    activeBids: 0,
    wonAuctions: 0,
    availableAuctions: 0,
    loading: true,
    error: null,
  });

  const fetchStats = async () => {
    if (!dealerProfile?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Get active bids count for this dealer
      const { count: activeBidsCount, error: bidsError } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealerProfile.id)
        .eq('status', 'active');

      if (bidsError) {
        console.error('Error fetching active bids:', bidsError);
        throw new Error(`Failed to fetch active bids: ${bidsError.message}`);
      }

      // Get available auctions count (running auctions)
      const { count: availableAuctionsCount, error: auctionsError } = await supabase
        .from('auction_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running')
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString());

      if (auctionsError) throw auctionsError;

      // Get won auctions count from dealer_won_vehicles table
      const { count: wonCount, error: wonError } = await supabase
        .from('dealer_won_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', dealerProfile.id);

      if (wonError) throw wonError;

      setStats({
        activeBids: activeBidsCount || 0,
        wonAuctions: wonCount || 0,
        availableAuctions: availableAuctionsCount || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dealer stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load stats',
      }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dealerProfile?.id]);

  // Set up real-time subscriptions for stats updates
  useEffect(() => {
    if (!dealerProfile?.id) return;

    const bidsChannel = supabase
      .channel('dealer-bids-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${dealerProfile.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const auctionsChannel = supabase
      .channel('auction-schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_schedules',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const wonVehiclesChannel = supabase
      .channel('dealer-won-vehicles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dealer_won_vehicles',
          filter: `dealer_id=eq.${dealerProfile.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(auctionsChannel);
      supabase.removeChannel(wonVehiclesChannel);
    };
  }, [dealerProfile?.id, dealerProfile?.user_id]);

  return { ...stats, refetch: fetchStats };
};