import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-[90vh] lg:min-h-[85vh]">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-8 lg:pr-8"
          >
            <div className="space-y-6">
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-4xl font-bold text-body-text leading-tight">
                  Aukcja samochodowa <span className="text-primary">online</span>
                </h1>
                <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-4xl font-bold text-body-text leading-tight">
                  Tylko dla <span className="text-primary">dealerów</span>.
                </h1>
              </div>
              
              <div className="w-20 h-1 bg-primary rounded-full"></div>
              
              <p className="text-subtitle-text text-lg lg:text-xl leading-relaxed max-w-2xl">
                Autaro.pl to pierwsza w Polsce aukcja samochodowa online stworzona dla dealerów. Codziennie nowe oferty aut tylko od osób prywatnych, dostępne wyłącznie dla dealerów. Wszystkie samochody są zarejestrowane w Polsce, z pełnym profilem i przejrzystym opisem.
              </p>
              
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                <p className="text-primary font-semibold text-lg lg:text-xl leading-relaxed">
                  Start już wkrótce! Zarejestruj swój komis teraz i odbierz 50% zniżki na pierwszą prowizję oraz powiadomienie o starcie codziennych aukcji!
                </p>
              </div>
            </div>
            
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <a
                href="#vehicles"
                className="btn-primary text-lg lg:text-xl px-8 lg:px-12 py-4 lg:py-5 flex items-center gap-3 group shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Załóż konto teraz!
                <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
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