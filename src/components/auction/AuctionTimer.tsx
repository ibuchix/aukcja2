
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AuctionTimerProps {
  auctionEndTime: string;
}

export const AuctionTimer = ({ auctionEndTime }: AuctionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const isMobile = useIsMobile();

  useEffect(() => {
    // If no end time provided, show unavailable
    if (!auctionEndTime) {
      setTimeRemaining("Czas niedostępny");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(auctionEndTime);
      const distance = end.getTime() - now.getTime();

      // If auction has ended
      if (distance < 0) {
        setTimeRemaining("Aukcja zakończona");
        return false; // Stop the timer
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Format as HH:MM:SS
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
      
      return true; // Continue the timer
    };

    // Initial update
    updateTimer();

    const timer = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionEndTime]);

  return (
    <span 
      className={cn(
        "font-kanit font-semibold bg-white rounded-md shadow-sm",
        "text-[#D81B24]",
        isMobile ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5"
      )}
    >
      {timeRemaining}
    </span>
  );
};
