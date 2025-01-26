import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { BidNotificationHandler } from "./BidNotificationHandler";

interface MaxBidInterfaceProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  auctionEndTime: string;
}

export const MaxBidInterface = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  auctionEndTime,
}: MaxBidInterfaceProps) => {
  const [maxBid, setMaxBid] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const { toast } = useToast();

  // Calculate and update time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(auctionEndTime).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining("Auction ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeRemaining(
          `${days}d ${hours}h ${minutes}m ${seconds}s`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionEndTime]);

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
    <>
      <BidNotificationHandler 
        carId={carId}
        dealerId={dealerId}
        currentBid={currentHighestBid}
      />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald">Place Maximum Bid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-subtitle-text">
            <Clock className="w-4 h-4" />
            <span>Time Remaining: {timeRemaining}</span>
          </div>
          
          <div className="flex items-center gap-2 text-subtitle-text">
            <DollarSign className="w-4 h-4" />
            <span>Current Highest Bid: ${currentHighestBid}</span>
          </div>
          
          <div className="flex items-center gap-2 text-subtitle-text">
            <TrendingUp className="w-4 h-4" />
            <span>Minimum Increment: ${minimumIncrement}</span>
          </div>

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
        </CardContent>
      </Card>
    </>
  );
};