
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
        onClick={onRefresh} 
        disabled={isLoading}
        className="flex items-center gap-2 md:gap-3 text-sm md:text-base lg:text-lg font-semibold shadow-lg px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-3 h-auto"
      >
        <Car className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
        <span className="whitespace-nowrap">{isLoading ? "Odświeżanie..." : "Odśwież aukcję"}</span>
      </Button>
    </div>
  );
};
