import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubscribeToBidButtonProps {
  className?: string;
}

export const SubscribeToBidButton = ({ className }: SubscribeToBidButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            className={`w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white ${className ?? ""}`}
          >
            <Link to="/dealer/subscription">
              <Lock className="mr-2 h-5 w-5" />
              Subskrybuj, aby licytować
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          Aktywna subskrypcja jest wymagana do składania ofert.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SubscribeToBidButton;