import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscribeToBidButtonProps {
  className?: string;
}

export const SubscribeToBidButton = ({ className }: SubscribeToBidButtonProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error ?? "Nie udało się utworzyć sesji płatności.");
      }
    } catch (err) {
      toast({
        title: "Błąd",
        description: (err as Error).message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSubscribe}
            disabled={submitting}
            className={`w-full min-h-16 h-auto py-3 px-4 text-sm sm:text-base md:text-lg font-bold bg-green-600 hover:bg-green-700 text-white whitespace-normal break-words leading-snug text-center flex items-center justify-center gap-2 ${className ?? ""}`}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            ) : (
              <Lock className="h-5 w-5 shrink-0" />
            )}
            <span>Wykup abonament, aby zobaczyć dane sprzedającego</span>
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
