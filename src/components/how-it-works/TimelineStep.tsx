
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
              <div className="space-y-2 text-subtitle-text">
                {bulletPoints.map((point, index) => (
                  <p key={index} className="text-right">
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md z-10">
              <Icon className="w-8 h-8 text-primary" />
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md z-10">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="w-1/2 pl-8">
              <div className="space-y-2 text-subtitle-text">
                {bulletPoints.map((point, index) => (
                  <p key={index}>
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
