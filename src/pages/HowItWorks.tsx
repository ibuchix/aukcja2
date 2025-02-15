
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/Footer";
import { LucideAuction, Clock, UserCheck, Gavel, Trophy, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">How Auto-Strada Works</h1>
          <p className="text-subtitle-text text-center text-lg max-w-3xl mx-auto">
            Your comprehensive guide to participating in our dealer-exclusive vehicle auctions
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sign Up */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Sign Up & Verification</h3>
              <p className="text-subtitle-text">
                Register as a dealer and provide your business credentials. Our team will verify your dealership status within 24-48 hours.
              </p>
            </motion.div>

            {/* Browse Auctions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <LucideAuction className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Browse Active Auctions</h3>
              <p className="text-subtitle-text">
                Explore our daily inventory of quality vehicles. New auctions start every weekday at 9:00 AM CET.
              </p>
            </motion.div>

            {/* Place Bids */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Gavel className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Place Your Bids</h3>
              <p className="text-subtitle-text">
                Submit competitive bids on vehicles you're interested in. Track your bids in real-time through your dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Auction Details */}
      <section className="bg-accent py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Auction Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-6">
                <Clock className="text-primary w-6 h-6 mr-3" />
                <h3 className="text-xl font-semibold">Auction Schedule</h3>
              </div>
              <ul className="space-y-4 text-subtitle-text">
                <li>• Auctions start daily at 9:00 AM CET</li>
                <li>• Each auction runs for 24 hours</li>
                <li>• Results are announced immediately after closing</li>
                <li>• New vehicles are listed every weekday</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-6">
                <Trophy className="text-primary w-6 h-6 mr-3" />
                <h3 className="text-xl font-semibold">Winning & Payment</h3>
              </div>
              <ul className="space-y-4 text-subtitle-text">
                <li>• Winners are notified via email and dashboard</li>
                <li>• Payment must be completed within 48 hours</li>
                <li>• Multiple secure payment methods accepted</li>
                <li>• Vehicle collection arranged after payment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-iris-light p-8 rounded-lg">
            <div className="flex items-center mb-6">
              <AlertCircle className="text-iris w-6 h-6 mr-3" />
              <h3 className="text-xl font-semibold text-iris">Important Notes</h3>
            </div>
            <ul className="space-y-4 text-subtitle-text">
              <li>• All bids are binding and cannot be retracted</li>
              <li>• Vehicles are sold "as-is" with detailed condition reports</li>
              <li>• Reserve prices may apply to certain vehicles</li>
              <li>• Documentation and history available for all vehicles</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
