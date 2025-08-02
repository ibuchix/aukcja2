import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-[85vh] lg:min-h-[80vh]">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 mt-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-body-text" style={{ lineHeight: '1.4' }}>
              Kupuj <span className="text-primary">Pewnie</span>. Kupuj Opłacalnie.
              <br />
              Kupuj na Autaro.pl!
            </h1>
            <p className="text-subtitle-text text-lg max-w-2xl mt-6">
              Autaro.pl to pierwsza w Polsce aukcja samochodowa w formacie C2B. Sprzedawać mogą wyłącznie osoby prywatne, a kupować jedynie zarejestrowane firmy. Wszystkie samochody na naszych codziennych aukcjach są zarejestrowane w Polsce.
            </p>
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <a
                href="#vehicles"
                className="btn-primary text-xl px-12 py-4 flex items-center gap-2 group"
              >
                Otwórz Konto Teraz
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative rounded-xl overflow-hidden shadow-2xl"
          >
            <img 
              src="/lovable-uploads/b24a3610-60c6-410c-8968-6f9712177254.png"
              alt="Premium AUTOKOMIS dealership showcasing quality vehicles"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;