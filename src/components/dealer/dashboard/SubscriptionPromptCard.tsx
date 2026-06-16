import { Link } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";

export const SubscriptionPromptCard = () => {
  const { isActive, isLoading } = useDealerSubscription();

  if (isLoading || isActive) return null;

  return (
    <Alert className="border-[#16A34A]/20 bg-[#16A34A]/5">
      <Crown className="h-4 w-4 text-[#16A34A]" />
      <AlertTitle className="text-[#16A34A]">
        Aktywuj subskrypcję, aby licytować
      </AlertTitle>
      <AlertDescription className="text-[#16A34A]/80 space-y-4">
        <p>
          Odblokuj pełny dostęp do aukcji na żywo i danych kontaktowych
          sprzedających po wygranej.
        </p>
        <Button
          asChild
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          <Link to="/dealer/subscription">
            Subskrybuj teraz
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default SubscriptionPromptCard;
