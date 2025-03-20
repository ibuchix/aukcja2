
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";

interface UseProxyBidProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const useProxyBid = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: UseProxyBidProps) => {
  const [maxBid, setMaxBid] = useState<string>("");
  const [existingProxyBid, setExistingProxyBid] = useState<number | null>(null);
  const [isProxyBidUsed, setIsProxyBidUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch existing proxy bid for this car
  useEffect(() => {
    const fetchProxyBid = async () => {
      try {
        const result = await executeWithRetry(() => 
          supabase
            .from('proxy_bids')
            .select('max_bid_amount, last_processed_amount')
            .eq('car_id', carId)
            .eq('dealer_id', dealerId)
            .single()
        ) as PostgrestSingleResponse<{ max_bid_amount: number, last_processed_amount: number | null }>;

        if (result.error && result.error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
          throw result.error;
        }

        if (result.data) {
          setExistingProxyBid(result.data.max_bid_amount);
          setMaxBid(result.data.max_bid_amount.toString());
          setIsProxyBidUsed(result.data.last_processed_amount !== null);
        }
      } catch (error) {
        console.error("Error fetching proxy bid:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (carId && dealerId) {
      fetchProxyBid();
    }
  }, [carId, dealerId]);

  const handleSetMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const numericMaxBid = parseFloat(maxBid);
      if (isNaN(numericMaxBid)) {
        throw new Error("Please enter a valid number");
      }

      if (numericMaxBid <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of $${currentHighestBid}`);
      }

      // Check if the bid is divisible by the minimum increment
      if (numericMaxBid % minimumIncrement !== 0) {
        throw new Error(`Bid must be divisible by the minimum increment of $${minimumIncrement}`);
      }

      // Use upsert with onConflict to handle concurrent submissions
      const result = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .upsert({
            car_id: carId,
            dealer_id: dealerId,
            max_bid_amount: numericMaxBid,
          }, {
            onConflict: 'car_id,dealer_id'
          })
      ) as PostgrestResponse<any>;

      if (result.error) throw result.error;

      setExistingProxyBid(numericMaxBid);
      // If we're modifying an existing proxy bid that was used, it stays in "used" state
      // If not, then it's a new or unused proxy bid
      
      toast({
        title: "Maximum Bid Set",
        description: `Your maximum bid of $${numericMaxBid.toLocaleString()} has been set successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const result = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .delete()
          .eq('car_id', carId)
          .eq('dealer_id', dealerId)
      ) as PostgrestResponse<any>;

      if (result.error) throw result.error;

      setExistingProxyBid(null);
      setMaxBid("");
      setIsProxyBidUsed(false);
      
      toast({
        title: "Maximum Bid Removed",
        description: "Your maximum bid has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    maxBid,
    setMaxBid,
    existingProxyBid,
    isProxyBidUsed,
    isLoading,
    isSubmitting,
    handleSetMaxBid,
    handleRemoveMaxBid
  };
};
