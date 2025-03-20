
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { verifyDealer, rejectDealer } from '@/services/admin/adminService';

export interface PendingDealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: string;
  created_at: string;
  user_id: string;
}

export function usePendingDealers() {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadPendingDealers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select(`
          id, 
          dealership_name, 
          supervisor_name, 
          verification_status, 
          created_at,
          user_id
        `)
        .eq('verification_status', 'pending');

      if (error) throw error;
      setPendingDealers(data || []);
    } catch (error) {
      console.error('Error loading pending dealers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending dealers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleVerifyDealer = async (dealerId: string) => {
    try {
      const success = await verifyDealer(dealerId);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Dealer has been verified',
          variant: 'default',
        });
        
        // Refresh the list
        loadPendingDealers();
      } else {
        throw new Error('Failed to verify dealer');
      }
    } catch (error) {
      console.error('Error verifying dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify dealer',
        variant: 'destructive',
      });
    }
  };

  const handleRejectDealer = async (dealerId: string) => {
    try {
      const success = await rejectDealer(dealerId);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Dealer has been rejected',
          variant: 'default',
        });
        
        // Refresh the list
        loadPendingDealers();
      } else {
        throw new Error('Failed to reject dealer');
      }
    } catch (error) {
      console.error('Error rejecting dealer:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject dealer',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadPendingDealers();
  }, [loadPendingDealers]);

  return {
    pendingDealers,
    isLoading,
    loadPendingDealers,
    handleVerifyDealer,
    handleRejectDealer
  };
}
