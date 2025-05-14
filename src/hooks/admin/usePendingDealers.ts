
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isSelectQueryError } from '@/utils/supabaseHelpers';

export interface PendingDealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: string;
  created_at: string;
  submitted_at?: string;
}

export function usePendingDealers() {
  const [dealers, setDealers] = useState<PendingDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingDealers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dealers')
          .select('id, dealership_name, supervisor_name, verification_status, created_at')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter valid dealer data and handle type safety
        if (data) {
          const validDealers = data.filter((dealer): dealer is PendingDealer => 
            dealer !== null &&
            typeof dealer === 'object' &&
            !isSelectQueryError(dealer) &&
            'id' in dealer &&
            'dealership_name' in dealer &&
            'supervisor_name' in dealer
          );
          
          setDealers(validDealers);
        } else {
          setDealers([]);
        }
      } catch (err) {
        console.error('Error fetching pending dealers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching dealers');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDealers();
  }, []);

  return { dealers, loading, error };
}
