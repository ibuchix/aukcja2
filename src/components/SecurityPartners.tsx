import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const SecurityPartners = () => {
  return (
    <section className="py-20" style={{backgroundColor: '#454545'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{color: '#FCFCFC'}}>
            Zabezpieczenie Kupujących
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* CarVertical Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl font-bold text-blue-600">
                CARVERTICAL
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center px-4"
          >
            <p className="text-lg leading-relaxed" style={{color: '#FCFCFC'}}>
              Współpracujemy z platformami CarVertical i AutoBaza, aby dać wam opcje zakupu dokładnego raportu historii pojazdu. Umożliwia to zapoznanie się z historią przebiegu, wykaże kradzież samochodu, historie przeznaczenia i użytkowania, a także uszkodzenia, nawet jeżeli zdarzenie było poza Polską.
            </p>
          </motion.div>

          {/* AutoBaza Logo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-2xl font-bold">
                <span className="text-blue-600">auto</span>
                <span className="text-red-600">baza</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SecurityPartners;