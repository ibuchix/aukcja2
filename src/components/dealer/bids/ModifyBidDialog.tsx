
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";

interface ModifyBidDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bid: MyBid | null;
  onConfirm: (newAmount: number, isProxyBid: boolean, maxProxyAmount?: number) => void;
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
  const [isProxyBid, setIsProxyBid] = useState(false);
  const [maxProxyAmount, setMaxProxyAmount] = useState<string>("");

  if (!bid) return null;

  const currentBid = bid.car?.current_bid || 0;
  const minimumBid = Math.max(currentBid + 250, bid.amount + 100); // Minimum increment
  const newAmountNum = parseFloat(newAmount) || 0;
  const maxProxyAmountNum = parseFloat(maxProxyAmount) || 0;

  const isValidBid = newAmountNum >= minimumBid;
  const isValidProxyBid = !isProxyBid || (maxProxyAmountNum >= newAmountNum);

  const handleSubmit = () => {
    if (isValidBid && isValidProxyBid) {
      onConfirm(newAmountNum, isProxyBid, isProxyBid ? maxProxyAmountNum : undefined);
      setNewAmount("");
      setMaxProxyAmount("");
      setIsProxyBid(false);
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
              <div>Minimum new bid: {formatCurrency(minimumBid)}</div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newAmount">New Bid Amount (PLN)</Label>
            <Input
              id="newAmount"
              type="number"
              min={minimumBid}
              step="50"
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isProxyBid"
              checked={isProxyBid}
              onCheckedChange={(checked) => setIsProxyBid(checked as boolean)}
            />
            <Label htmlFor="isProxyBid" className="text-sm">
              Set as proxy bid (automatic bidding)
            </Label>
          </div>

          {isProxyBid && (
            <div className="grid gap-2">
              <Label htmlFor="maxProxyAmount">Maximum Proxy Bid Amount (PLN)</Label>
              <Input
                id="maxProxyAmount"
                type="number"
                min={newAmountNum}
                step="50"
                value={maxProxyAmount}
                onChange={(e) => setMaxProxyAmount(e.target.value)}
                placeholder={`Minimum: ${newAmountNum}`}
              />
              {maxProxyAmount && !isValidProxyBid && (
                <p className="text-sm text-destructive">
                  Maximum proxy amount must be at least equal to your bid amount
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The system will automatically place bids up to this amount to keep you winning
              </p>
            </div>
          )}
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
            disabled={!isValidBid || !isValidProxyBid || isLoading}
          >
            {isLoading ? "Updating..." : "Update Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
