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
  const [maxBid, setMaxBid] = useState<string>("");
  const { toast } = useToast();

  const handleSetMaxBid = async () => {
    try {
      const numericMaxBid = parseFloat(maxBid);
      if (isNaN(numericMaxBid)) {
        throw new Error("Please enter a valid number");
      }

      if (numericMaxBid <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of $${currentHighestBid}`);
      }

      const { error } = await supabase
        .from('proxy_bids')
        .upsert({
          car_id: carId,
          dealer_id: dealerId,
          max_bid_amount: numericMaxBid,
        });

      if (error) throw error;

      toast({
        title: "Maximum Bid Set",
        description: `Your maximum bid of $${numericMaxBid} has been set successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set maximum bid",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={maxBid}
        onChange={(e) => setMaxBid(e.target.value)}
        placeholder="Enter your maximum bid"
        min={currentHighestBid + minimumIncrement}
        step={minimumIncrement}
        className="flex-1"
      />
      <Button onClick={handleSetMaxBid}>
        Set Max Bid
      </Button>
    </div>
  );
};