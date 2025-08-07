
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export const ProxyBiddingExample = () => {
  return (
    <section className="pb-2 pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-lg shadow-md border border-white/20"
          style={{ backgroundColor: '#393b39' }}
        >
          <h3 className="text-xl font-semibold mb-4 text-body-text">Jak działa system proxy?</h3>
          <div className="space-y-4 text-body-text">
            <p>1. Przykładowa cena orientacyjna samochodu wynosi {formatCurrency(50000)}. Pamiętaj, możesz składać oferty powyżej i poniżej ceny orientacyjnej.</p>
            <p>2. Twoja oferta wynosi {formatCurrency(55000)}. Nasz system proxy licytuje w przyrostach co {formatCurrency(250)}.</p>
            <p>3. Jeśli inny dealer złoży ofertę w wysokości {formatCurrency(52000)}, Twoja oferta automatycznie wzrośnie do {formatCurrency(52250)}.</p>
            <p>4. To trwa do momentu, gdy:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Wygrasz aukcję o {formatCurrency(250)} więcej niż druga najwyższa oferta lub licytacja przekroczy Twój maksymalny limit {formatCurrency(55000)}.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
