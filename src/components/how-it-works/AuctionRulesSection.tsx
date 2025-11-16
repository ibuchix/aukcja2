import { Calendar, Zap, EyeOff, DollarSign, Phone, Wallet, Car, Flag, CheckCircle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const rules = [
  {
    icon: Calendar,
    title: "Czas Trwania Aukcji",
    description: "Aukcja trwa od niedzieli 20:00 do piątku 15:00 — możesz licytować o dowolnej porze. Każda aukcja trwa cały tydzień, co daje Ci dużo czasu na przejrzenie samochodów, sprawdzenie VIN, ocenę zdjęć i złożenie oferty w dogodnym momencie. Nie ma presji czasu — możesz działać wtedy, kiedy najbardziej Ci pasuje.",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Natychmiastowy Zakup",
    description: "Zakup może nastąpić w każdej chwili, gdy sprzedający zaakceptuje ofertę. Sprzedający widzi tylko najwyższą aktualną ofertę i może ją zaakceptować w każdym momencie, więc aukcja nie wymaga czekania do ostatniej sekundy. Jeśli Twoja oferta zostanie zaakceptowana transakcja zostaje zamknięta natychmiast. Auta często sprzedają się już po pierwszej sensownej ofercie.",
    color: "iris"
  },
  {
    icon: EyeOff,
    title: "Ukryte Oferty",
    description: "Oferty są ukryte — widzi je wyłącznie sprzedający. Inne komisy nie widzą Twoich ofert ani historii licytacji. Dzięki temu możesz licytować spokojnie, bez sztucznego podbijania cen. Sprzedający widzi tylko najwyższą aktualną ofertę.",
    color: "primary"
  },
  {
    icon: DollarSign,
    title: "Cena Orientacyjna",
    description: "Cena orientacyjna = kwota zaakceptowana przez sprzedającego. Cena orientacyjna jest wartością, którą sprzedający już zaakceptował jako rozsądną cenę sprzedaży. Oferty blisko tej kwoty mają największe szanse na natychmiastowy zakup — to punkt odniesienia, który przyspiesza finalizację.",
    color: "iris"
  },
  {
    icon: Phone,
    title: "Kontakt ze Sprzedającym",
    description: "Po Twojej ofercie natychmiast kontaktujemy sprzedającego w celu finalizacji. Nasz zespół negocjacyjny działa w czasie rzeczywistym. Gdy złożysz ofertę, od razu podejmujemy rozmowy ze sprzedającym, aby jak najszybciej potwierdzić sprzedaż lub poprosić Cię o ewentualną korektę ceny.",
    color: "primary"
  },
  {
    icon: Wallet,
    title: "Płatność przy Odbiorze",
    description: "Płacisz dopiero po odbiorze auta, bezpośrednio sprzedającemu. Wygrana oferta nie oznacza natychmiastowej płatności online. Najpierw umawiasz się na odbiór, oględziny i jazdę próbną. Jeśli wszystko zgadza się z opisem — płacisz gotówką lub przelewem sprzedającemu. Jeśli są niezgodności, możesz negocjować lub zrezygnować.",
    color: "iris"
  },
  {
    icon: Car,
    title: "Prywatne Auta w Cenach Handlowych",
    description: "Prywatne auta w cenach handlowych — dostępne tylko dla komisów. Każdy sprzedający zaakceptował niższą, komisową cenę, aby przyspieszyć sprzedaż. Kupujesz więc od prywatnych właścicieli, ale po cenach atrakcyjnych dla handlu — z wyłącznym dostępem dla komisów.",
    color: "primary"
  },
  {
    icon: Flag,
    title: "Tylko Auta z Polski",
    description: "Wszystkie auta są zarejestrowane w Polsce. Na Autaro wystawiamy wyłącznie samochody z polskimi dokumentami i aktualną rejestracją w kraju. Nie ma pojazdów z importu, bez dowodu rejestracyjnego czy problematycznej historii.",
    color: "iris"
  },
  {
    icon: CheckCircle,
    title: "Brak Kosztów za Składanie Ofert",
    description: "Licytowanie jest całkowicie bezpłatne. Prowizję Autaro płacisz dopiero wtedy, gdy wygrasz samochód i sprzedający zaakceptuje Twoją ofertę.",
    color: "primary"
  },
  {
    icon: MessageCircle,
    title: "Masz Pytania?",
    description: "Jeśli masz jakiekolwiek pytania, zadzwoń do nas pod +48 459 567 877 lub napisz na WhatsApp.",
    color: "iris"
  }
];

export const AuctionRulesSection = () => {
  return (
    <section className="py-20 bg-[#2d2f2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-heading-lg font-kanit font-bold text-[#FCFCFC] mb-4">
            Zasady Aukcji – Pełne Wyjaśnienie
          </h2>
          <p className="text-subtitle text-subtitle-text max-w-3xl mx-auto">
            Poznaj wszystkie szczegóły dotyczące aukcji na Autaro.pl
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-background rounded-default border border-accent p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    rule.color === 'iris' ? 'bg-iris/20' : 'bg-primary/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      rule.color === 'iris' ? 'text-iris' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-heading-sm font-kanit font-semibold text-[#FCFCFC] mb-2">
                      {rule.title}
                    </h3>
                    <p className="text-body text-body-text leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
