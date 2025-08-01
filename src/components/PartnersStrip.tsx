import { motion } from "framer-motion";

const PartnersStrip = () => {
  // Create a repeating pattern of the two logos
  const logoPattern = Array.from({ length: 30 }).map((_, index) => {
    return index % 2 === 0 ? {
      src: "/lovable-uploads/c422918c-46b1-438f-9883-b8555c740281.png",
      alt: "CarVertical",
      key: `carvertical-${index}`
    } : {
      src: "/lovable-uploads/ca191bd1-dc54-4a7c-8595-2ed24be23c65.png", 
      alt: "Autobaza",
      key: `autobaza-${index}`
    };
  });

  return (
    <div className="bg-white py-2 overflow-hidden relative">
      <div className="flex items-center">
        {/* First scrolling strip */}
        <motion.div 
          className="flex items-center gap-20 whitespace-nowrap"
          animate={{ x: [0, -2400] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {logoPattern.map((logo) => (
            <img 
              key={logo.key}
              src={logo.src}
              alt={logo.alt}
              className="h-6 object-contain flex-shrink-0"
            />
          ))}
        </motion.div>

        {/* Second scrolling strip for seamless loop */}
        <motion.div 
          className="flex items-center gap-20 whitespace-nowrap"
          animate={{ x: [0, -2400] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {logoPattern.map((logo) => (
            <img 
              key={`second-${logo.key}`}
              src={logo.src}
              alt={logo.alt}
              className="h-6 object-contain flex-shrink-0"
            />
          ))}
        </motion.div>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white px-6 py-1 border-l border-r border-gray-200">
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