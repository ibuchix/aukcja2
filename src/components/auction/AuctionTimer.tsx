
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { isCurrentlyAfter } from "@/utils/ukTimeUtils";

interface AuctionTimerProps {
  auctionEndTime: string;
  auctionTimingStatus?: 'scheduled' | 'active' | 'ended' | 'unknown';
}

export const AuctionTimer = ({ auctionEndTime, auctionTimingStatus }: AuctionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    // Handle different auction states with Polish translations
    if (auctionTimingStatus === 'ended') {
      setTimeRemaining("Aukcja zakończona");
      return;
    } else if (auctionTimingStatus === 'scheduled') {
      setTimeRemaining("Aukcja nie rozpoczęta");
      return;
    }
    
    // For 'active' or 'unknown' status, show the countdown if we have an end time
    if (!auctionEndTime) {
      setTimeRemaining("Czas niedostępny");
      return;
    }

    const updateTimer = () => {
      // Use consistent UTC time calculation like in the timing utilities
      const now = new Date();
      const end = new Date(auctionEndTime);
      const distance = end.getTime() - now.getTime();

      if (distance < 0 || isCurrentlyAfter(auctionEndTime)) {
        setTimeRemaining("Aukcja zakończona");
        return false; // Stop the timer
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Format display based on time remaining
        if (days > 0) {
          setTimeRemaining(`${days} dni ${hours} godzin`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours} godzin ${minutes} minut`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes} minut ${seconds} sekund`);
        } else {
          setTimeRemaining(`${seconds} sekund`);
        }
        return true; // Continue the timer
      }
    };

    // Initial update
    if (!updateTimer()) return;

    const timer = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(timer);
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
