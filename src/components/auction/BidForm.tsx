
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const BidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: BidFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>((currentHighestBid + minimumIncrement).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handlePlaceBid = async () => {
    try {
      setIsSubmitting(true);
      const numericBidAmount = parseFloat(bidAmount);
      
      if (isNaN(numericBidAmount)) {
        throw new Error("Please enter a valid number");
      }

      if (numericBidAmount <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of $${currentHighestBid}`);
      }

      // Check if the bid is divisible by the minimum increment
      if (numericBidAmount % minimumIncrement !== 0) {
        throw new Error(`Bid must be divisible by the minimum increment of $${minimumIncrement}`);
      }

      // Call the place_bid function on the server
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount,
        p_is_proxy: false
      });

      if (error) {
        // Check if this is a concurrency or transaction isolation error
        if (error.message?.includes('SERIALIZATION_FAILURE') || 
            error.message?.includes('LOCK_TIMEOUT') ||
            error.message?.includes('CONCURRENT_MODIFICATION') ||
            error.message?.includes('DEADLOCK')) {
          
          if (retryCount < 3) {
            // Automatic retry with exponential backoff
            setRetryCount(prev => prev + 1);
            toast({
              title: "Bidding System Busy",
              description: "The auction is experiencing high activity. Retrying your bid...",
            });
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
            setIsSubmitting(false);
            return handlePlaceBid();
          } else {
            throw new Error("The auction is very active right now. Please try again in a moment.");
          }
        }
        
        throw error;
      }
      
      // Check the response data structure properly
      if (typeof data === 'object' && data !== null && 'success' in data) {
        if (!data.success) {
          throw new Error(data.error?.toString() || 'Failed to place bid');
        }

        // Reset retry count on success
        setRetryCount(0);

        toast({
          title: "Bid Placed",
          description: `Your bid of $${numericBidAmount.toLocaleString()} has been placed successfully`,
        });

        // Update the bid amount input field to be the current + minimum increment
        setBidAmount((numericBidAmount + minimumIncrement).toString());
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Enter bid amount"
        min={currentHighestBid + minimumIncrement}
        step={minimumIncrement}
        className="flex-1"
      />
      <Button onClick={handlePlaceBid} disabled={isSubmitting}>
        {isSubmitting ? "Placing Bid..." : "Place Bid"}
      </Button>
    </div>
  );
};
