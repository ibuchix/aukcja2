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
            Autaro.pl to pierwsza w Polsce platforma zakupu aut stworzona wyłącznie dla dealerów. Samochody mogą sprzedawać tylko zweryfikowani prywatni sprzedający, a dostęp do platformy mają wyłącznie zarejestrowani dealerzy. Po obu stronach są wyłącznie zweryfikowani uczestnicy — prawdziwi prywatni właściciele i sprawdzeni dealerzy — co eliminuje przypadkowość i daje pewność każdej transakcji.
          </p>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{color: '#FCFCFC'}}>Sprzedający otwarci na sprzedaż do handlu.</h3>
            <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
              Wszyscy sprzedający na platformie świadomie wystawiają auta z myślą o sprzedaży dealerom. Ich oczekiwania cenowe są do tego dopasowane, dzięki czemu negocjacje są krótsze, a cała transakcja przebiega sprawnie i bez nieporozumień.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{color: '#FCFCFC'}}>Natychmiastowy dostęp do danych kontaktowych.</h3>
            <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
              W ramach abonamentu widzisz dane kontaktowe sprzedającego przy każdym samochodzie. Możesz skontaktować się od razu, bez pośredników i bez czekania — co pozwala szybko domknąć transakcję, zanim zrobi to ktoś inny.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{color: '#FCFCFC'}}>Każde auto opisane według tego samego schematu.</h3>
            <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
              Wszystkie samochody są profilowane w identyczny sposób, z tym samym zakresem informacji — w tym z raportem historii pojazdu oraz raportem stanu technicznego. Wiesz dokładnie, co kupujesz, jeszcze przed kontaktem ze sprzedającym.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{color: '#FCFCFC'}}>Tylko zweryfikowani prywatni sprzedający.</h3>
            <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
              Eliminujemy ukrytych handlarzy podszywających się pod osoby prywatne. Każdy sprzedający jest weryfikowany, więc masz pewność, że kupujesz auto bezpośrednio od prawdziwego właściciela.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MoreInfo;