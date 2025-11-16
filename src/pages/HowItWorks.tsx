
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HeroSection } from "@/components/how-it-works/HeroSection";
import { WinningProcess } from "@/components/how-it-works/WinningProcess";
import { ProxyBiddingExample } from "@/components/how-it-works/ProxyBiddingExample";
import { AuctionRulesSection } from "@/components/how-it-works/AuctionRulesSection";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#393b39]">
      <Navbar />
      <HeroSection />
      <AuctionRulesSection />
      <ProxyBiddingExample />
      <WinningProcess />
      <Footer />
    </div>
  );
};

export default HowItWorks;
