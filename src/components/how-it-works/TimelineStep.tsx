
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface TimelineStepProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bulletPoints: string[];
  isRight?: boolean;
  iconColor?: "primary" | "iris";
}

export const TimelineStep = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  bulletPoints, 
  isRight = false,
  iconColor = "primary" 
}: TimelineStepProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: isRight ? 100 : -100 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative mb-24"
    >
      <div className="flex items-center mb-4">
        {isRight ? (
          <>
            <div className="w-1/2 pr-8 text-right">
              <ul className="space-y-2 text-subtitle-text">
                {bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-center justify-end">
                    <span className={`w-2 h-2 bg-${iconColor} rounded-full ml-2`} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`w-12 h-12 bg-${iconColor} rounded-full flex items-center justify-center z-10`}>
              <Icon className="text-white w-6 h-6" />
            </div>
            <div className="w-1/2 pl-8">
              <h3 className="text-2xl font-bold text-body-text mb-2">{title}</h3>
              <p className="text-subtitle-text">{subtitle}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-1/2 pr-8 text-right">
              <h3 className="text-2xl font-bold text-body-text mb-2">{title}</h3>
              <p className="text-subtitle-text">{subtitle}</p>
            </div>
            <div className={`w-12 h-12 bg-${iconColor} rounded-full flex items-center justify-center z-10`}>
              <Icon className="text-white w-6 h-6" />
            </div>
            <div className="w-1/2 pl-8">
              <ul className="space-y-2 text-subtitle-text">
                {bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-center">
                    <span className={`w-2 h-2 bg-${iconColor} rounded-full mr-2`} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
