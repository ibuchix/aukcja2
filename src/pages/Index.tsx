
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
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

      <Footer />
    </div>
  );
};

export default Index;
