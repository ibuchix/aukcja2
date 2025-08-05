import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-[85vh] lg:min-h-[80vh]">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-between"
          >
            <div className="space-y-8 relative">
              {/* Promotional Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -top-4 -right-4 md:right-0 bg-primary text-white px-4 py-2 rounded-full shadow-lg animate-pulse z-10"
              >
                <span className="text-sm font-bold">🎉 50% OFF New Dealers!</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-body-text" style={{ lineHeight: '1.4' }}>
                Kupuj <span className="text-primary">Pewnie</span>. Kupuj Opłacalnie.
                <br />
                Kupuj na Autaro.pl!
              </h1>
              <p className="text-subtitle-text text-lg max-w-2xl">
                Autaro.pl to pierwsza w Polsce aukcja samochodowa online stworzona jedynie dla dealerów. Codziennie nowe oferty aut tylko od osób prywatnych, dostępne wyłącznie dla zweryfikowanych dealerów. Wszystkie pojazdy są zarejestrowane w Polsce, z pełnym profilem i przejrzystym opisem. Start już wkrótce! Zarejestruj swój komis teraz i odbierz 50% zniżki na pierwszą prowizję oraz powiadomienie o starcie codziennych aukcji!
              </p>
              <p className="text-primary font-semibold text-sm">
                ⏰ Limited Time Offer - Act Now!
              </p>
            </div>
            <motion.div 
              className="flex gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <a
                href="#vehicles"
                className="btn-primary text-xl px-12 py-4 flex items-center gap-2 group"
              >
                Claim 50% OFF - Sign Up Now!
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