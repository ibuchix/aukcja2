
import { useState, useEffect } from "react";

interface AuctionTimerProps {
  auctionEndTime: string;
}

export const AuctionTimer = ({ auctionEndTime }: AuctionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

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
    <span className="font-medium text-primary">
      {timeRemaining}
    </span>
  );
};
