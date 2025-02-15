
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, UserCheck, Gavel, Trophy, AlertCircle, Search } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-accent/20">
      <Navbar />
      
      {/* Hero Section with floating elements */}
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

      {/* Timeline Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-iris" />

            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative mb-24"
            >
              <div className="flex items-center mb-4">
                <div className="w-1/2 pr-8 text-right">
                  <h3 className="text-2xl font-bold text-dark mb-2">Sign Up & Verification</h3>
                  <p className="text-subtitle-text">Register as a dealer and provide your credentials</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center z-10">
                  <UserCheck className="text-white w-6 h-6" />
                </div>
                <div className="w-1/2 pl-8">
                  <ul className="space-y-2 text-subtitle-text">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      Complete dealer registration form
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      Submit business documents
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      24-48 hour verification process
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative mb-24"
            >
              <div className="flex items-center mb-4">
                <div className="w-1/2 pr-8 text-right">
                  <ul className="space-y-2 text-subtitle-text">
                    <li className="flex items-center justify-end">
                      <span className="w-2 h-2 bg-iris rounded-full ml-2" />
                      Browse available vehicles
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="w-2 h-2 bg-iris rounded-full ml-2" />
                      View detailed vehicle reports
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="w-2 h-2 bg-iris rounded-full ml-2" />
                      Track auction timelines
                    </li>
                  </ul>
                </div>
                <div className="w-12 h-12 bg-iris rounded-full flex items-center justify-center z-10">
                  <Search className="text-white w-6 h-6" />
                </div>
                <div className="w-1/2 pl-8">
                  <h3 className="text-2xl font-bold text-dark mb-2">Browse Active Auctions</h3>
                  <p className="text-subtitle-text">New auctions daily at 9:00 AM CET</p>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex items-center mb-4">
                <div className="w-1/2 pr-8 text-right">
                  <h3 className="text-2xl font-bold text-dark mb-2">Place Your Bids</h3>
                  <p className="text-subtitle-text">Participate in 24-hour auctions</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center z-10">
                  <Gavel className="text-white w-6 h-6" />
                </div>
                <div className="w-1/2 pl-8">
                  <ul className="space-y-2 text-subtitle-text">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      Submit competitive bids
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      Track in real-time
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                      Receive instant notifications
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Winning Process */}
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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Trophy className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Notification</h3>
              <p className="text-subtitle-text">
                Receive immediate confirmation via email and dashboard when you win an auction
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform"
            >
              <div className="bg-iris/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-iris w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">48-Hour Payment</h3>
              <p className="text-subtitle-text">
                Complete your payment within 48 hours using our secure payment methods
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Vehicle Collection</h3>
              <p className="text-subtitle-text">
                Arrange vehicle collection after payment confirmation
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
