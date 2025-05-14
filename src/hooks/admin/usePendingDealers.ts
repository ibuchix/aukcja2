
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isSelectQueryError } from '@/utils/supabaseHelpers';
import { verifyDealer, rejectDealer } from '@/services/admin/adminService';
import { toast } from '@/components/ui/use-toast';

export interface PendingDealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: string;
  created_at: string;
  submitted_at?: string;
}

export function usePendingDealers() {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingDealers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dealers')
        .select('id, dealership_name, supervisor_name, verification_status, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type guard to filter valid dealer data
      const validDealers = Array.isArray(data) 
        ? data.filter((item): item is PendingDealer => {
            return item !== null && 
                  typeof item === 'object' && 
                  !isSelectQueryError(item) &&
                  'id' in item &&
                  'dealership_name' in item &&
                  'supervisor_name' in item;
          })
        : [];
        
      setPendingDealers(validDealers);
    } catch (err) {
      console.error('Error fetching pending dealers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching dealers');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification of dealer
  const handleVerifyDealer = async (dealerId: string) => {
    try {
      setIsLoading(true);
      const result = await verifyDealer(dealerId);
      
      if (result) {
        toast({
          title: "Dealer verified",
          description: "The dealer has been successfully verified.",
        });
        
        // Refresh the dealers list
        await loadPendingDealers();
      } else {
        toast({
          title: "Verification failed",
          description: "There was an error verifying the dealer.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error verifying dealer:', err);
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejection of dealer
  const handleRejectDealer = async (dealerId: string) => {
    try {
      setIsLoading(true);
      const result = await rejectDealer(dealerId);
      
      if (result) {
        toast({
          title: "Dealer rejected",
          description: "The dealer has been rejected.",
        });
        
        // Refresh the dealers list
        await loadPendingDealers();
      } else {
        toast({
          title: "Rejection failed",
          description: "There was an error rejecting the dealer.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error rejecting dealer:', err);
      toast({
        title: "Rejection failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingDealers();
  }, []);

  return { 
    pendingDealers, 
    isLoading, 
    error, 
    loadPendingDealers, 
    handleVerifyDealer, 
    handleRejectDealer 
  };
}
