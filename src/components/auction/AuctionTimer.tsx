
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface AuctionTimerProps {
  auctionEndTime: string;
  auctionTimingStatus?: 'scheduled' | 'active' | 'ended' | 'unknown';
}

export const AuctionTimer = ({ auctionEndTime, auctionTimingStatus }: AuctionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    // Show timer for active auctions and also handle 'unknown' status better
    if (auctionTimingStatus === 'ended') {
      setTimeRemaining("Auction ended");
      return;
    } else if (auctionTimingStatus === 'scheduled') {
      setTimeRemaining("Auction not started");
      return;
    }
    
    // For 'active' or 'unknown' status, show the countdown if we have an end time
    if (!auctionEndTime) {
      setTimeRemaining("Time not available");
      return;
    }

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
  }, [auctionEndTime, auctionTimingStatus]);

  return (
    <span className="font-medium">
      {timeRemaining}
    </span>
  );
};
