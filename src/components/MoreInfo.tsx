import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const MoreInfo = () => {
  return (
    <section className="pt-2 pb-16" style={{backgroundColor: '#454545'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{color: '#FCFCFC'}}>
            Więcej Informacji o Autaro.pl
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-6 text-left p-8 rounded-lg"
          style={{backgroundColor: '#393b39'}}
        >
          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
           Autaro.pl to pierwsza w Polsce aukcja samochodowa online stworzona jedynie dla dealerów. Codziennie nowe oferty aut tylko od osób prywatnych, dostępne wyłącznie dla zweryfikowanych dealerów.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wszystkie samochody dostępne do zakupu na naszej platformie są zarejestrowane w Polsce.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Nasz algorytm wycenia samochody w taki sposob, aby byly oplacalne dla dealerow kupujaych na naszych aukcjach.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            <strong>Aukcja trwa od niedzieli 20:00 do piątku 15:00 — możesz licytować o dowolnej porze.</strong>
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Każda aukcja trwa cały tydzień, co daje Ci dużo czasu na przejrzenie samochodów, sprawdzenie VIN, ocenę zdjęć i złożenie oferty w dogodnym momencie. Nie ma presji czasu — możesz działać wtedy, kiedy najbardziej Ci pasuje.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            <strong>Zakup może nastąpić w każdej chwili, gdy sprzedający zaakceptuje ofertę.</strong>
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Sprzedający widzi tylko najwyższą aktualną ofertę i może ją zaakceptować w każdym momencie, więc aukcja nie wymaga czekania do ostatniej sekundy. Jeśli Twoja oferta zostanie zaakceptowana, transakcja zostaje zamknięta natychmiast. Auta często sprzedają się już po pierwszej sensownej ofercie.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            <strong>Oferty są ukryte — widzi je wyłącznie sprzedający.</strong>
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Inne komisy nie widzą Twoich ofert ani historii licytacji. Dzięki temu możesz licytować spokojnie, bez sztucznego podbijania cen. Sprzedający widzi tylko najwyższą aktualną ofertę.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wszystkie samochody wystawione na aukcji są profilowane w ten sam sposób, aby wyeliminować wadliwe lub niedokładne profile samochodów.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Jako dealer kupujący masz możliwość ostatecznej weryfikacji samochodu pod względem jego profilu podczas odbioru, zanim sfinalizujesz zakup.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Jeżeli stan samochodu jest zgodny z jego profilem, dealer płaci cenę na miejscu i kupuje samochód.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Jezeli stan samochodu jest niezgodny z jego profilem, jest mozliwosc negocjacji ceny lub calkowitego odwolania zakupu. 
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            W przypadku całkowitego odwołania zakupu, wystarczy wypełnić protokół anulacji sprzedaży, a pełna prowizja zapłacona przed odbiorem zostanie zwrócona.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MoreInfo;