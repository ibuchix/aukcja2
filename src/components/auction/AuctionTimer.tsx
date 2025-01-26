import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface AuctionTimerProps {
  auctionEndTime: string;
}

export const AuctionTimer = ({ auctionEndTime }: AuctionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

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

  return (
    <div className="flex items-center gap-2 text-subtitle-text">
      <Clock className="w-4 h-4" />
      <span>Time Remaining: {timeRemaining}</span>
    </div>
  );
};