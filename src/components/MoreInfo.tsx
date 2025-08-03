import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const MoreInfo = () => {
  return (
    <section className="pt-4 pb-20" style={{backgroundColor: '#454545'}}>
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
          className="max-w-4xl mx-auto space-y-6 text-center"
        >
          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Autaro.pl to pierwsza w Polsce aukcja samochodowa w formacie C2B. Sprzedawać mogą tylko osoby prywatne, a kupować wyłącznie zarejestrowani przedsiębiorcy.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wszystkie samochody dostępne do zakupu na naszej platformie są zarejestrowane w Polsce.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Nasz algorytm wycenia pojazdy na sprzedaż w taki sposób, aby firmy kupujące mogły zarobić na sprzedaży samochodu w swoich Salonach lub Komisach.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wystarczy złożyć maksymalną ofertę na wybrane pojazdy, a nasz system licytacji Proxy pomoże Ci uzyskać najniższą możliwą cenę za dany pojazd, licytując w krokach po 250 PLN aż do osiągnięcia Twojej maksymalnej oferty.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wszystkie samochody wystawione na codziennej aukcji są profilowane w ten sam sposób, aby wyeliminować wadliwe lub niedokładne profile samochodów.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Wiemy, że nie każde ogłoszenie będzie w 100% zgodne ze stanem pojazdu, dlatego ostateczna ocena jest dokonywana przez kupującego już na miejscu.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Jeżeli stan samochodu jest zgodny z ogłoszeniem, kupujący płaci cenę na miejscu i otrzymuje pełną dokumentację pojazdu.
          </p>

          <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
            Jeżeli z pojazdem jest coś nie tak, istnieje możliwość negocjacji ceny lub całkowitego odwołania zakupu. Warunkiem jest niezgodność stanu pojazdu z ogłoszeniem w serwisie www.autaro.pl.
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