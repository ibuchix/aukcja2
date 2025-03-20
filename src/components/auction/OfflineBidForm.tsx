
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";
import { queueStandardBid, processBid } from "@/services/offlineBidQueue";
import { Wifi, WifiOff } from "lucide-react";

interface OfflineBidFormProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const OfflineBidForm = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: OfflineBidFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>((currentHighestBid + minimumIncrement).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOnline } = useOnlineStatusContext();
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

      if (numericBidAmount % minimumIncrement !== 0) {
        throw new Error(`Bid must be divisible by the minimum increment of $${minimumIncrement}`);
      }

      if (isOnline) {
        // Process bid normally using BidForm logic
        // This is a placeholder for the existing logic in BidForm.tsx
        // We'll integrate this in the next step
      } else {
        // Add the bid to the offline queue
        const queuedBid = queueStandardBid(carId, dealerId, numericBidAmount);
        
        toast({
          title: "Bid Queued",
          description: `Your bid of $${numericBidAmount.toLocaleString()} will be placed when you're back online.`,
        });

        // Update the bid amount input field to be the current + minimum increment
        setBidAmount((numericBidAmount + minimumIncrement).toString());
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
      <Button 
        onClick={handlePlaceBid} 
        disabled={isSubmitting}
        className="relative"
      >
        <span className="flex items-center">
          {isSubmitting ? "Placing Bid..." : "Place Bid"}
          {isOnline ? (
            <Wifi className="ml-2 h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="ml-2 h-4 w-4 text-yellow-500" />
          )}
        </span>
      </Button>
    </div>
  );
};
