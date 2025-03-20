
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface OptimalBidButtonProps {
  onClick: () => void;
  isActive: boolean;
  title?: string;
}

export const OptimalBidButton = ({
  onClick,
  isActive,
  title = "Use AI-recommended optimal bid"
}: OptimalBidButtonProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      type="button"
      onClick={onClick}
      className="flex-shrink-0"
      title={title}
    >
      <Lightbulb className={`h-4 w-4 ${isActive ? 'text-yellow-500' : ''}`} />
    </Button>
  );
};
