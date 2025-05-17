
import React from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

interface RefreshListingsButtonProps {
  onRefresh: () => void;
}

export const RefreshListingsButton = ({ onRefresh }: RefreshListingsButtonProps) => {
  return (
    <div className="flex justify-end">
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        className="flex items-center gap-2"
      >
        <Car className="h-4 w-4" />
        Refresh Listings
      </Button>
    </div>
  );
};
