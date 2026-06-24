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
            className={`w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 text-white ${className ?? ""}`}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Lock className="mr-2 h-5 w-5" />
            )}
            Wykup abonament, aby zobaczyć dane sprzedającego
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
