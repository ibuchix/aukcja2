import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  return (
    <div className="bg-accent py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Dealers Say</h2>
          <p className="text-subtitle-text">Trusted by hundreds of dealers nationwide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-primary fill-current" />
                ))}
              </div>
              <p className="text-subtitle-text mb-4">
                "The platform has transformed how we source our inventory. The process is seamless and the quality of vehicles is outstanding."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full" />
                <div>
                  <h4 className="font-semibold">John Smith</h4>
                  <p className="text-subtitle-text text-sm">Premium Motors</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;