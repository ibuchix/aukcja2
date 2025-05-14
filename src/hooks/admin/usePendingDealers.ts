
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define the PendingDealer interface
export interface PendingDealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: string;
  created_at: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  user_id: string;
}

// Type guard for PendingDealer
function isPendingDealer(item: any): item is PendingDealer {
  return (
    item !== null &&
    typeof item === 'object' &&
    'id' in item &&
    'dealership_name' in item &&
    'supervisor_name' in item &&
    'verification_status' in item
  );
}

export const usePendingDealers = () => {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPendingDealers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('verification_status', 'pending');

        if (error) throw error;

        if (data) {
          // Filter the data to ensure it matches the expected structure
          const validDealers = data.filter(isPendingDealer);
          setPendingDealers(validDealers);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch pending dealers'));
        console.error('Error fetching pending dealers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDealers();
  }, []);

  return { pendingDealers, loading, error };
};
