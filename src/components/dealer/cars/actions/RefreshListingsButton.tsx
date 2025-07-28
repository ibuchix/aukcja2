
import React from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

interface RefreshListingsButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export const RefreshListingsButton = ({ onRefresh, isLoading = false }: RefreshListingsButtonProps) => {
  return (
    <div className="flex justify-end">
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        disabled={isLoading}
        className="flex items-center gap-2 bg-secondary border-accent/20 text-body-text hover:bg-accent/20"
      >
        <Car className="h-4 w-4" />
        {isLoading ? "Refreshing..." : "Refresh Listings"}
      </Button>
    </div>
  );
};
