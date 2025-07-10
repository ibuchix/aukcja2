
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
  const newAmountNum = parseFloat(newAmount) || 0;

  const isValidBid = newAmountNum > 0;

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
              <div>Latest bid: {formatCurrency(currentBid)}</div>
              <div>Enter any amount you're willing to pay for this vehicle</div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newAmount">New Bid Amount (PLN)</Label>
            <Input
              id="newAmount"
              type="number"
              min="1"
              step="1"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Enter your bid amount (PLN)"
            />
            {newAmount && !isValidBid && (
              <p className="text-sm text-destructive">
                Bid amount must be greater than 0
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
