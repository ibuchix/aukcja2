
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

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to place bid');
      }

      toast({
        title: "Bid Placed",
        description: `Your bid of $${numericBidAmount.toLocaleString()} has been placed successfully`,
      });

      // Update the bid amount input field to be the current + minimum increment
      setBidAmount((numericBidAmount + minimumIncrement).toString());
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
