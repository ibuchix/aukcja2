
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";

interface ModifyBidDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bid: MyBid | null;
  onConfirm: (newAmount: number) => void;
  isLoading?: boolean;
}

export const ModifyBidDialog = ({
  isOpen,
  onOpenChange,
  bid,
  onConfirm,
  isLoading = false,
}: ModifyBidDialogProps) => {
  const [newAmount, setNewAmount] = useState<string>("");

  if (!bid) return null;

  const currentBid = bid.car?.current_bid || 0;
  const minimumBid = Math.max(currentBid + 1, bid.amount + 1); // Just needs to be higher than current
  const newAmountNum = parseFloat(newAmount) || 0;

  const isValidBid = newAmountNum >= minimumBid;

  const handleSubmit = () => {
    if (isValidBid) {
      onConfirm(newAmountNum);
      setNewAmount("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modify Bid</DialogTitle>
          <DialogDescription>
            Update your bid for{" "}
            <strong>{bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Current Information</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Your current bid: {formatCurrency(bid.amount)}</div>
              <div>Current highest bid: {formatCurrency(currentBid)}</div>
              <div>Your new bid must be at least: {formatCurrency(minimumBid)}</div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newAmount">New Bid Amount (PLN)</Label>
            <Input
              id="newAmount"
              type="number"
              min={minimumBid}
              step="1"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder={`Minimum: ${minimumBid}`}
            />
            {newAmount && !isValidBid && (
              <p className="text-sm text-destructive">
                Bid must be at least {formatCurrency(minimumBid)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValidBid || isLoading}
          >
            {isLoading ? "Updating..." : "Update Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
