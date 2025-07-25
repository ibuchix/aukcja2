import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-screen">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-iris-light -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-dark leading-tight">
              Kupuj <span className="text-primary">Pewnie</span>. Kupuj Opłacalnie.
              <br />
              Kupuj na Autaro.pl!
            </h1>
            <p className="text-subtitle-text text-lg max-w-2xl">
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

          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-8 p-8 bg-white/50 backdrop-blur-sm rounded-lg border border-accent"
          >
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-4xl font-bold text-primary mb-2">2,500+</h3>
              <p className="text-subtitle-text">Active Listings</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-4xl font-bold text-primary mb-2">500+</h3>
              <p className="text-subtitle-text">Verified Dealers</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-4xl font-bold text-primary mb-2">100+</h3>
              <p className="text-subtitle-text">Live Auctions</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-4xl font-bold text-primary mb-2">98%</h3>
              <p className="text-subtitle-text">Satisfaction Rate</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;