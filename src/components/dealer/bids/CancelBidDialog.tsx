
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";

interface CancelBidDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bid: MyBid | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const CancelBidDialog = ({
  isOpen,
  onOpenChange,
  bid,
  onConfirm,
  isLoading = false,
}: CancelBidDialogProps) => {
  if (!bid) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Bid</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your bid of{" "}
            <strong>{formatCurrency(bid.amount)}</strong> on{" "}
            <strong>{bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}</strong>?
            <br />
            <br />
            This action cannot be undone and you will no longer be participating in this auction.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Keep Bid
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Cancelling..." : "Cancel Bid"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
