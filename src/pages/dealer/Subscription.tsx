import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function SubscriptionPage() {
  const { isActive, status, currentPeriodEnd, cancelAtPeriodEnd, isLoading, refresh } =
    useDealerSubscription();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [submitting, setSubmitting] = useState<"checkout" | "cancel" | null>(null);

  useEffect(() => {
    const s = params.get("status");
    if (s === "success") {
      toast({
        title: "Subskrypcja aktywowana",
        description: "Dziękujemy! Twój dostęp został odblokowany.",
      });
      // Webhook may need a moment
      setTimeout(() => refresh(), 1500);
      params.delete("status");
      params.delete("session_id");
      setParams(params, { replace: true });
    } else if (s === "cancelled") {
      toast({
        title: "Płatność anulowana",
        description: "Możesz spróbować ponownie w dowolnej chwili.",
        variant: "destructive",
      });
      params.delete("status");
      setParams(params, { replace: true });
    }
  }, [params, setParams, toast, refresh]);

  const handleSubscribe = async () => {
    setSubmitting("checkout");
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
      setSubmitting(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Czy na pewno chcesz anulować subskrypcję na koniec okresu rozliczeniowego?")) {
      return;
    }
    setSubmitting("cancel");
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      toast({
        title: "Subskrypcja anulowana",
        description: "Dostęp wygaśnie wraz z końcem bieżącego okresu rozliczeniowego.",
      });
      await refresh();
    } catch (err) {
      toast({
        title: "Błąd",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <DashboardLayout title="Subskrypcja">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-body-text">Dostęp do danych sprzedawców</h2>
            <p className="text-subtitle-text mt-2">
              Po aktywacji subskrypcji uzyskasz natychmiastowy dostęp do imienia, adresu e-mail
              i numeru telefonu sprzedawców wszystkich aktywnych aukcji. Możesz skontaktować się z nimi
              bezpośrednio, aby ustalić warunki zakupu.
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-body-text">999 PLN</span>
            <span className="text-subtitle-text">netto / miesiąc</span>
          </div>
          <p className="text-sm text-subtitle-text">+ 23% VAT (229,77 PLN). Łącznie 1 228,77 PLN brutto.</p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-subtitle-text">
              <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie statusu…
            </div>
          ) : isActive ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Subskrypcja aktywna</span>
              </div>
              {currentPeriodEnd && (
                <p className="text-sm text-subtitle-text">
                  {cancelAtPeriodEnd ? "Wygasa" : "Odnowi się"}:{" "}
                  {new Date(currentPeriodEnd).toLocaleDateString("pl-PL")}
                </p>
              )}
              {!cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting === "cancel"}
                >
                  {submitting === "cancel" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Anuluj subskrypcję
                </Button>
              ) : (
                <p className="text-sm text-subtitle-text">
                  Subskrypcja zostanie anulowana po zakończeniu bieżącego okresu.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {status && (
                <p className="text-sm text-subtitle-text">
                  Status: <span className="font-medium">{status}</span>
                </p>
              )}
              <Button
                onClick={handleSubscribe}
                disabled={submitting === "checkout"}
                className="w-full text-white"
                style={{ backgroundColor: "#D81B24" }}
              >
                {submitting === "checkout" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Subskrybuj
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3 text-sm text-subtitle-text">
          <h3 className="text-base font-semibold text-body-text">Co otrzymujesz</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Natychmiastowy dostęp do danych kontaktowych sprzedawców na wszystkich aktywnych aukcjach</li>
            <li>Możliwość kontaktu telefonicznego i mailowego ze sprzedawcą</li>
            <li>Bezterminowy dostęp dopóki subskrypcja jest aktywna</li>
            <li>Możliwość anulowania w dowolnym momencie — dostęp znika po zakończeniu okresu</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}