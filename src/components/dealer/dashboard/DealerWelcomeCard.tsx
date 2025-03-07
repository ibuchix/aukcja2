
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

interface DealerWelcomeCardProps {
  dealerName?: string;
  dealershipName?: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ 
  dealerName, 
  dealershipName,
  isLoading 
}: DealerWelcomeCardProps) => {
  // Get current time to display greeting
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
  
  return (
    <div className="bg-gradient-to-r from-iris-light to-blue-50 border-l-4 border-iris rounded-r-lg mb-8 shadow-sm">
      <div className="pt-6 pb-6 px-6 text-dark">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 bg-white/20" />
            <Skeleton className="h-4 w-1/2 bg-white/20" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {greeting}, {dealerName || "Dealer"}
              </h2>
              <div className="flex items-center text-iris text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <p className="text-subtitle-text">
              {dealershipName 
                ? `Managing ${dealershipName}`
                : "Your dealer dashboard - manage your inventory and track auctions"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
