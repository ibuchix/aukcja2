
import { Skeleton } from "@/components/ui/skeleton";

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
            <h2 className="text-2xl font-bold">
              Welcome, {dealerName || "Dealer"}
            </h2>
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
