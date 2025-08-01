import { motion } from "framer-motion";

const PartnersStrip = () => {
  return (
    <div className="bg-white py-4 overflow-hidden">
      <div className="flex items-center justify-center relative">
        {/* Left side logos - repeated pattern */}
        <motion.div 
          className="flex items-center space-x-8 absolute left-0"
          animate={{ x: [0, -200] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`left-${index}`} className="flex items-center space-x-8">
              <img 
                src="/lovable-uploads/c422918c-46b1-438f-9883-b8555c740281.png" 
                alt="CarVertical" 
                className="h-8 object-contain"
              />
              <img 
                src="/lovable-uploads/ca191bd1-dc54-4a7c-8595-2ed24be23c65.png" 
                alt="Autobaza" 
                className="h-8 object-contain"
              />
            </div>
          ))}
        </motion.div>

        {/* Right side logos - repeated pattern */}
        <motion.div 
          className="flex items-center space-x-8 absolute right-0"
          animate={{ x: [200, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`right-${index}`} className="flex items-center space-x-8">
              <img 
                src="/lovable-uploads/c422918c-46b1-438f-9883-b8555c740281.png" 
                alt="CarVertical" 
                className="h-8 object-contain"
              />
              <img 
                src="/lovable-uploads/ca191bd1-dc54-4a7c-8595-2ed24be23c65.png" 
                alt="Autobaza" 
                className="h-8 object-contain"
              />
            </div>
          ))}
        </motion.div>

        {/* Center text */}
        <div className="bg-white px-8 z-10 relative">
          <h3 className="text-accent font-oswald font-bold text-lg tracking-wider">
            NASI PARTNERZY
          </h3>
        </div>
      </div>
    </div>
  );
};

export default PartnersStrip;