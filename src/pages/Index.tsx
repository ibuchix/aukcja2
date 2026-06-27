
import Hero from "@/components/Hero";
import DealerReviews from "@/components/DealerReviews";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import MoreInfo from "@/components/MoreInfo";
import SecurityPartners from "@/components/SecurityPartners";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />

      {/* Dealer Reviews Section */}
      <DealerReviews />
      
      {/* Services Section */}
      <Services />

      {/* How It Works Section */}
      <HowItWorks />

      {/* More Info Section */}
      <MoreInfo />

      {/* Security Partners Section */}
      <SecurityPartners />

      <Footer />
    </div>
  );
};

export default Index;
