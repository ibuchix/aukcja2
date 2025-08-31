
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import VideoDemo from "@/components/VideoDemo";
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
      
      {/* Services Section */}
      <Services />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Video Demo Section */}
      <VideoDemo />

      {/* More Info Section */}
      <MoreInfo />

      {/* Security Partners Section */}
      <SecurityPartners />

      <Footer />
    </div>
  );
};

export default Index;
