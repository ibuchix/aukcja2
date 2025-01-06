import { motion } from "framer-motion";
import { Car, Shield, Clock } from "lucide-react";

const MarketplaceHero = () => {
  return (
    <div className="bg-iris-light">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark">
            Find Your Perfect <span className="text-primary">Vehicle</span>
          </h1>
          <p className="text-subtitle-text text-lg md:text-xl">
            Browse through our curated selection of premium vehicles from verified sellers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            { icon: Car, title: "Premium Selection", description: "Curated high-quality vehicles" },
            { icon: Shield, title: "Verified Sellers", description: "100% trusted dealers" },
            { icon: Clock, title: "Quick Process", description: "Efficient buying experience" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-subtitle-text">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHero;