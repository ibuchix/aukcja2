
import { Button } from "@/components/ui/button";
import { UserCheck, UserX } from "lucide-react";
import { PendingDealer } from "@/hooks/admin/usePendingDealers";

interface PendingDealerItemProps {
  dealer: PendingDealer;
  onVerify: (dealerId: string) => Promise<void>;
  onReject: (dealerId: string) => Promise<void>;
}

export function PendingDealerItem({ dealer, onVerify, onReject }: PendingDealerItemProps) {
  return (
    <div className="border rounded-md p-3 flex justify-between items-center">
      <div>
        <h4 className="font-medium">{dealer.dealership_name}</h4>
        <p className="text-sm text-muted-foreground">
          Supervisor: {dealer.supervisor_name}
        </p>
        <p className="text-xs text-muted-foreground">
          Submitted: {new Date(dealer.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onVerify(dealer.id)}
        >
          <UserCheck className="h-4 w-4 mr-1" />
          Verify
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onReject(dealer.id)}
        >
          <UserX className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}
