
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserCheck, Gavel, Trophy, Search } from "lucide-react";
import { HeroSection } from "@/components/how-it-works/HeroSection";
import { TimelineStep } from "@/components/how-it-works/TimelineStep";
import { WinningProcess } from "@/components/how-it-works/WinningProcess";
import { ProxyBiddingExample } from "@/components/how-it-works/ProxyBiddingExample";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#393b39]">
      <Navbar />
      <HeroSection />
      
      {/* Timeline Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-iris" />

            <TimelineStep 
              title="Rejestracja I weryfikacja"
              subtitle="Podaj wymagane informacje, aby otworzyć konto dealera na Autaro.pl"
              icon={UserCheck}
              bulletPoints={[
                "Wypełnij formularz rejestracji firmy",
                "Proces weryfikacji danych trwający 24-48 godzin",
                "Konto firmowe jest dostępne po zakończeniu weryfikacji danych"
              ]}
            />

            <TimelineStep 
              title="Codzienna aukcja online"
              subtitle="Aukcja odbywa się codziennie od 19:00 do 15:00 następnego dnia"
              icon={Search}
              bulletPoints={[
                "Każdy samochód jest dokładnie profilowany",
                "Codziennie nowe samochody na aukcji",
                "Możliwość pobrania raportów historii samochodów"
              ]}
              isRight
              iconColor="iris"
            />

            <TimelineStep 
              title="Złóż swoją ofertę"
              subtitle="Ustaw swoją maksymalną ofertę, a nasz system proxy zajmie się resztą"
              icon={Gavel}
              bulletPoints={[
                "Wprowadź swoją maksymalną ofertę",
                "System proxy licytuje za Ciebie w stopniach o 250PLN",
                "Automatycznie podnosi ofertę do twojej maksymalnej kwoty"
              ]}
            />

            <TimelineStep 
              title="Proxy Bidding System"
              subtitle="Our system works as your personal bidding agent"
              icon={Trophy}
              bulletPoints={[
                "System places minimum required bid",
                "Automatically outbids competitors",
                "Never exceeds your maximum amount"
              ]}
              isRight
              iconColor="iris"
            />
          </div>
        </div>
      </section>

      <ProxyBiddingExample />
      <WinningProcess />
      <Footer />
    </div>
  );
};

export default HowItWorks;
