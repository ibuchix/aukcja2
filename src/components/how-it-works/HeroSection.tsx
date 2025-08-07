
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative bg-[#454545] py-24 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-primary">
          Autaro.pl to pierwsza w Polsce aukcja samochodowa online, wyłącznie dla dealerów!
        </h1>
        <p className="text-body-text text-center text-lg md:text-xl max-w-3xl mx-auto">
          Autaro.pl to pierwsza w Polsce aukcja samochodowa online tylko dla dealerów. Zarejestruj firmę za darmo w kilku krokach i kupuj samochody od prywatnych sprzedawców.
        </p>
      </motion.div>

      {/* Floating background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="absolute bottom-10 left-20 w-72 h-72 bg-iris/5 rounded-full blur-3xl"
      />
    </section>
  );
};
