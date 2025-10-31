import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { PLATFORM_FEE_TIERS, calculatePlatformFee } from "@/utils/platformFeeCalculator";

const Pricing = () => {
  const [amount, setAmount] = useState<number | undefined>(undefined);

  const fee = useMemo(() => {
    if (amount === undefined || isNaN(amount)) return undefined;
    return calculatePlatformFee(amount);
  }, [amount]);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Opłaty platformy Autaro",
    provider: { "@type": "Organization", name: "Autaro" },
    areaServed: "PL",
    offers: PLATFORM_FEE_TIERS.map((t) => ({
      "@type": "Offer",
      price: t.fee,
      priceCurrency: "PLN",
      description: t.label,
      availability: "https://schema.org/InStock"
    }))
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Cennik opłat dla dealerów | Autaro"
        description="Zobacz cennik opłat platformy Autaro dla dealerów — stałe opłaty w PLN według przedziałów wygranej oferty."
        canonicalPath="/pricing"
        jsonLd={jsonLd}
      />

      <Navbar />

      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-10 md:pb-14">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-kanit font-bold text-heading-lg md:text-4xl text-body-text">
            Cennik opłat dla dealerów
          </h1>
          <div className="mx-auto mt-3 h-1 w-24 bg-primary rounded-full" aria-hidden="true" />
          <p className="mt-4 text-subtitle text-subtitle-text max-w-2xl mx-auto">
            Przejrzysta, stała opłata platformowa zależna od wysokości wygranej oferty. Wszystkie kwoty w PLN.
          </p>
        </header>

        <section aria-labelledby="calculator" className="mb-10 md:mb-14">
          <Card className="bg-background ring-1 ring-primary/20">
            <CardHeader>
              <CardTitle id="calculator" className="text-body-text">Kalkulator opłaty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="amount" className="block text-subtitle-text mb-2">Kwota wygranej oferty (PLN)</label>
                  <input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="w-full rounded-default bg-secondary text-body-text placeholder:text-subtitle-text border border-accent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="np. 45 000"
                    onChange={(e) => setAmount(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </div>
                <div>
                  <div className="text-subtitle-text mb-2">Szacowana opłata platformy</div>
                  <div className="rounded-default border border-accent bg-secondary px-4 py-3 text-body-text">
                    {fee !== undefined ? (
                      <span className="text-primary font-semibold">{fee.toLocaleString("pl-PL")} PLN</span>
                    ) : (
                      <span className="opacity-70">Wprowadź kwotę wygranej oferty</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-subtitle text-subtitle-text">
                Uwaga: Opłata jest stała w ramach danego przedziału i nie zależy od marki ani modelu pojazdu.
              </p>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="fee-table">
          <Card className="bg-background ring-1 ring-primary/20">
            <CardHeader>
              <CardTitle id="fee-table" className="text-body-text">
                Tabela opłat platformowych
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-default border border-accent">
                <table className="min-w-full">
                  <thead className="bg-primary/10">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-body-text">Przedział wygranej oferty</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-body-text">Opłata platformy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLATFORM_FEE_TIERS.map((tier, idx) => (
                      <tr key={tier.label} className={idx % 2 === 0 ? "bg-background" : "bg-secondary/40"}>
                        <td className="px-4 py-3 text-body-text">{tier.label}</td>
                        <td className="px-4 py-3 text-primary font-semibold">{tier.fee.toLocaleString("pl-PL")} PLN</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
