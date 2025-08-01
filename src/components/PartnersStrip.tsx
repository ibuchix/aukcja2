import { motion } from "framer-motion";

const PartnersStrip = () => {
  return (
    <div className="bg-white py-2 overflow-hidden relative">
      <div className="flex items-center justify-center">
        {/* Scrolling logos container */}
        <motion.div 
          className="flex items-center whitespace-nowrap"
          animate={{ x: [-200, -3000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <img 
                src="/lovable-uploads/c422918c-46b1-438f-9883-b8555c740281.png" 
                alt="CarVertical" 
                className="h-6 object-contain mx-16"
              />
              <img 
                src="/lovable-uploads/ca191bd1-dc54-4a7c-8595-2ed24be23c65.png" 
                alt="Autobaza" 
                className="h-6 object-contain mx-16"
              />
            </div>
          ))}
        </motion.div>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white px-6 py-1">
            <h3 className="text-accent font-oswald font-bold text-sm tracking-wider">
              NASI PARTNERZY
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersStrip;