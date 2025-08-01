
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PartnersStrip from "@/components/PartnersStrip";

const Index = () => {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Partners Strip */}
      <PartnersStrip />
      
      {/* Services Section */}
      <Services />

      <Footer />
    </div>
  );
};

export default Index;
