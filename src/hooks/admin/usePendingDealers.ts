import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidRecord, safelyFilterData } from '@/utils/supabaseHelpers';
import { toast } from '@/components/ui/use-toast';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPendingDealers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('verification_status', 'pending');

      if (error) throw error;

      if (data) {
        // Filter the data to ensure it matches the expected structure
        const validDealers = safelyFilterData(data, isPendingDealer);
        setPendingDealers(validDealers);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pending dealers'));
      console.error('Error fetching pending dealers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load pending dealers on component mount
  useEffect(() => {
    loadPendingDealers();
  }, [loadPendingDealers]);

  const handleVerifyDealer = async (dealerId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('dealers')
        .update({ verification_status: 'approved', is_verified: true })
        .eq('id', dealerId);
        
      if (error) throw error;
      
      toast({
        title: "Dealer Verified",
        description: "Dealer has been successfully verified.",
      });
      
      await loadPendingDealers();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to verify dealer'));
      toast({
        title: "Verification Failed",
        description: "There was a problem verifying the dealer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDealer = async (dealerId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('dealers')
        .update({ verification_status: 'rejected', is_verified: false })
        .eq('id', dealerId);
        
      if (error) throw error;
      
      toast({
        title: "Dealer Rejected",
        description: "Dealer has been rejected.",
      });
      
      await loadPendingDealers();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reject dealer'));
      toast({
        title: "Rejection Failed",
        description: "There was a problem rejecting the dealer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    pendingDealers, 
    isLoading, 
    error,
    loadPendingDealers,
    handleVerifyDealer,
    handleRejectDealer
  };
};
