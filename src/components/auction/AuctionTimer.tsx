import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface AuctionTimerProps {
  auctionEndTime: string;
  auctionFormat?: 'timed' | 'extended';
  extensionsUsed?: number;
  maxExtensionsAllowed?: number;
}

export const AuctionTimer = ({ 
  auctionEndTime,
  auctionFormat = 'timed',
  extensionsUsed = 0,
  maxExtensionsAllowed = 0
}: AuctionTimerProps) => {
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
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-subtitle-text">
        <Clock className="w-4 h-4" />
        <span>Time Remaining: {timeRemaining}</span>
      </div>
      {auctionFormat === 'extended' && (
        <div className="text-sm text-subtitle-text">
          Extensions: {extensionsUsed} / {maxExtensionsAllowed} used
        </div>
      )}
    </div>
  );
};