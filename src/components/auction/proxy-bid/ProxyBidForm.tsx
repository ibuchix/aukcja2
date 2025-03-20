
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProxyBidFormProps {
  maxBid: string;
  onMaxBidChange: (value: string) => void;
  onSetMaxBid: () => void;
  onRemoveMaxBid: () => void;
  existingProxyBid: number | null;
  isProxyBidUsed: boolean;
  isSubmitting: boolean;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const ProxyBidForm = ({
  maxBid,
  onMaxBidChange,
  onSetMaxBid,
  onRemoveMaxBid,
  existingProxyBid,
  isProxyBidUsed,
  isSubmitting,
  currentHighestBid,
  minimumIncrement,
}: ProxyBidFormProps) => {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={maxBid}
        onChange={(e) => onMaxBidChange(e.target.value)}
        placeholder={`Enter maximum bid (min: $${(currentHighestBid + minimumIncrement).toLocaleString()})`}
        min={currentHighestBid + minimumIncrement}
        step={minimumIncrement}
        className="flex-1"
        disabled={isSubmitting}
      />
      <Button 
        onClick={onSetMaxBid}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Setting..." : "Set Max Bid"}
      </Button>
      
      {existingProxyBid && !isProxyBidUsed && (
        <Button 
          variant="outline" 
          onClick={onRemoveMaxBid}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Removing..." : "Remove Max Bid"}
        </Button>
      )}
    </div>
  );
};
