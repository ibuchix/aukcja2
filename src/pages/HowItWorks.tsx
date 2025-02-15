
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserCheck, Gavel, Trophy, Search } from "lucide-react";
import { HeroSection } from "@/components/how-it-works/HeroSection";
import { TimelineStep } from "@/components/how-it-works/TimelineStep";
import { WinningProcess } from "@/components/how-it-works/WinningProcess";
import { ProxyBiddingExample } from "@/components/how-it-works/ProxyBiddingExample";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-accent/20">
      <Navbar />
      <HeroSection />
      
      {/* Timeline Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-iris" />

            <TimelineStep 
              title="Sign Up & Verification"
              subtitle="Register as a dealer and provide your credentials"
              icon={UserCheck}
              bulletPoints={[
                "Complete dealer registration form",
                "Submit business documents",
                "24-48 hour verification process"
              ]}
            />

            <TimelineStep 
              title="Browse Active Auctions"
              subtitle="New auctions daily at 9:00 AM CET"
              icon={Search}
              bulletPoints={[
                "Browse available vehicles",
                "View detailed vehicle reports",
                "Track auction timelines"
              ]}
              isRight
              iconColor="iris"
            />

            <TimelineStep 
              title="Place Your Maximum Bid"
              subtitle="Set your maximum bid and let our system work for you"
              icon={Gavel}
              bulletPoints={[
                "Enter your maximum bid amount",
                "System bids incrementally on your behalf",
                "Stay competitive without constant monitoring"
              ]}
            />

            <TimelineStep 
              title="Proxy Bidding System"
              subtitle="Our system works as your personal bidding agent"
              icon={Trophy}
              bulletPoints={[
                "System places minimum required bid",
                "Automatically outbids competitors",
                "Never exceeds your maximum amount"
              ]}
              isRight
              iconColor="iris"
            />
          </div>
        </div>
      </section>

      <ProxyBiddingExample />
      <WinningProcess />
      <Footer />
    </div>
  );
};

export default HowItWorks;
