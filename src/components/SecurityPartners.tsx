import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const SecurityPartners = () => {
  const isMobile = useIsMobile();
  
  return (
    <section className={`${isMobile ? 'pt-3 pb-16' : 'pt-4 pb-20'}`} style={{backgroundColor: '#454545'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}
        >
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-6`} style={{color: '#FCFCFC'}}>
            Zabezpieczenie Kupujących
          </h2>
        </motion.div>

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-1 lg:grid-cols-3 gap-8'} items-center`}>
          {/* CarVertical Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`flex ${isMobile ? 'justify-start' : 'justify-center'}`}
          >
            <a 
              href="https://www.carvertical.com/pl/landing/features?a=66c6155b1b60f&b=335b1726" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-105 cursor-pointer inline-block"
            >
              <img 
                src="/images/carvertical-logo.png" 
                alt="CarVertical Logo" 
                className={`${isMobile ? 'max-w-[160px]' : 'max-w-[200px]'} h-auto`}
              />
            </a>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${isMobile ? 'text-left px-4 py-6' : 'text-center px-8 py-8'} rounded-lg ${isMobile ? 'order-last' : ''}`}
            style={{backgroundColor: '#454545'}}
          >
            <p className={`${isMobile ? 'text-base' : 'text-lg'} leading-relaxed`} style={{color: '#FCFCFC'}}>
              Współpracujemy z platformami CarVertical i AutoBaza, aby dać wam opcje zakupu dokładnego raportu historii pojazdu. Umożliwia to zapoznanie się z historią przebiegu, wykaże kradzież samochodu, historie przeznaczenia i użytkowania, a także uszkodzenia, nawet jeżeli zdarzenie było poza Polską.
            </p>
          </motion.div>

          {/* AutoBaza Logo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`flex ${isMobile ? 'justify-start' : 'justify-center'}`}
          >
            <a 
              href="https://www.autobaza.pl/partnerid=80000634" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-105 cursor-pointer inline-block"
            >
              <img 
                src="/images/autobaza-logo.png" 
                alt="AutoBaza Logo" 
                className={`${isMobile ? 'max-w-[160px]' : 'max-w-[200px]'} h-auto`}
              />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SecurityPartners;