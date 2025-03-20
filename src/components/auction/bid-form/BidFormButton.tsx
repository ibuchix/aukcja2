
import { Button } from "@/components/ui/button";

interface BidFormButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
  label?: string;
  submittingLabel?: string;
}

export const BidFormButton = ({
  onClick,
  isSubmitting,
  label = "Place Bid",
  submittingLabel = "Placing Bid..."
}: BidFormButtonProps) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={isSubmitting}
    >
      {isSubmitting ? submittingLabel : label}
    </Button>
  );
};
