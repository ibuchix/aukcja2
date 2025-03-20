
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { PostgrestError } from "@supabase/supabase-js";

export interface ProxyBidHistoryItem {
  id: string;
  car_id: string;
  dealer_id: string;
  max_bid_amount: number;
  last_processed_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface UseProxyBidHistoryProps {
  carId: string;
  dealerId: string;
}

export const useProxyBidHistory = ({ carId, dealerId }: UseProxyBidHistoryProps) => {
  const [history, setHistory] = useState<ProxyBidHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProxyBidHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await executeWithRetry(() => 
          supabase
            .from('proxy_bids')
            .select('*')
            .eq('car_id', carId)
            .eq('dealer_id', dealerId)
            .order('created_at', { ascending: false })
        );
        
        if (result.error) {
          throw result.error;
        }

        setHistory(result.data || []);
      } catch (err) {
        console.error("Error fetching proxy bid history:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch proxy bid history");
      } finally {
        setIsLoading(false);
      }
    };

    if (carId && dealerId) {
      fetchProxyBidHistory();
    }
  }, [carId, dealerId]);

  return {
    history,
    isLoading,
    error
  };
};
