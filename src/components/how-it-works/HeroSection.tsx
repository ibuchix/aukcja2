
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-accent to-white py-24 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-iris">
          Your Journey with Auto-Strada
        </h1>
        <p className="text-subtitle-text text-center text-lg md:text-xl max-w-3xl mx-auto">
          Follow our simple process to start bidding on exclusive vehicles
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
