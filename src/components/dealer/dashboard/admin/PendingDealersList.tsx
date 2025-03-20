
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PendingDealer } from "@/hooks/admin/usePendingDealers";
import { PendingDealerItem } from "./PendingDealerItem";

interface PendingDealersListProps {
  dealers: PendingDealer[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onVerify: (dealerId: string) => Promise<void>;
  onReject: (dealerId: string) => Promise<void>;
}

export function PendingDealersList({ 
  dealers, 
  isLoading, 
  onRefresh, 
  onVerify, 
  onReject 
}: PendingDealersListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Pending Dealer Verifications ({dealers.length})</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {dealers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending verifications.</p>
      ) : (
        <div className="space-y-3">
          {dealers.map((dealer) => (
            <PendingDealerItem
              key={dealer.id}
              dealer={dealer}
              onVerify={onVerify}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
