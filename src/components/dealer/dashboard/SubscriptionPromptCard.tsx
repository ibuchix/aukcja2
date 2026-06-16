import { Link } from "react-router-dom";
import { Sparkles, Gavel, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";

export const SubscriptionPromptCard = () => {
  const { isActive, isLoading } = useDealerSubscription();

  if (isLoading || isActive) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border-l-4 border-green-500 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-md">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-500/10 blur-2xl" aria-hidden />
      <div className="relative p-5 md:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-green-100 p-2 text-green-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-kanit font-semibold text-gray-900">
              Aktywuj subskrypcję, aby licytować
            </h2>
            <p className="mt-1 text-sm md:text-base text-gray-700">
              Odblokuj pełny dostęp do aukcji na żywo i danych kontaktowych sprzedających po wygranej.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-800">
            <Gavel className="h-4 w-4 text-green-600" />
            Dostęp do aukcji na żywo
          </div>
          <div className="flex items-center gap-2 text-gray-800">
            <Sparkles className="h-4 w-4 text-green-600" />
            Nielimitowane oferty
          </div>
          <div className="flex items-center gap-2 text-gray-800">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Dane sprzedającego po wygranej
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <Button
            asChild
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
          >
            <Link to="/dealer/subscription">
              Subskrybuj teraz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/dealer/subscription"
            className="text-sm text-green-700 hover:text-green-800 underline-offset-4 hover:underline"
          >
            Dowiedz się więcej o subskrypcji
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPromptCard;