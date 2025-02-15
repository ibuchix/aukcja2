
import { motion } from "framer-motion";
import { Clock, Trophy, AlertCircle, LucideIcon } from "lucide-react";

export const WinningProcess = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-accent/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">When You Win</h2>
          <p className="text-subtitle-text max-w-2xl mx-auto">
            Our streamlined process ensures a smooth transaction after winning an auction
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <WinningStep 
            icon={Trophy}
            title="Instant Notification"
            description="Receive immediate confirmation via email and dashboard when you win an auction"
            color="primary"
            delay={0}
          />
          <WinningStep 
            icon={Clock}
            title="48-Hour Payment"
            description="Complete your payment within 48 hours using our secure payment methods"
            color="iris"
            delay={0.2}
          />
          <WinningStep 
            icon={AlertCircle}
            title="Vehicle Collection"
            description="Arrange vehicle collection after payment confirmation"
            color="primary"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

interface WinningStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "iris";
  delay: number;
}

const WinningStep = ({ icon: Icon, title, description, color, delay }: WinningStepProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform"
    >
      <div className={`bg-${color}/10 w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
        <Icon className={`text-${color} w-6 h-6`} />
      </div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-subtitle-text">
        {description}
      </p>
    </motion.div>
  );
};
