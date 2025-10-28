
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
        variant="default"
        size="lg"
        onClick={onRefresh} 
        disabled={isLoading}
        className="flex items-center gap-3 text-lg font-semibold shadow-lg"
      >
        <Car className="h-6 w-6" />
        {isLoading ? "Odświeżanie..." : "Odśwież aukcję"}
      </Button>
    </div>
  );
};
