import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VehicleCard from "@/components/VehicleCard";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

const Index = () => {
  const featuredVehicles = [
    {
      image: "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&q=80",
      name: "Porsche 911 GT3",
      price: "$162,450",
      specs: {
        speed: "198 mph",
        acceleration: "3.2s",
        power: "502 hp",
      },
    },
    {
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80",
      name: "Ferrari F8 Tributo",
      price: "$276,550",
      specs: {
        speed: "211 mph",
        acceleration: "2.9s",
        power: "710 hp",
      },
    },
    {
      image: "https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&q=80",
      name: "Lamborghini Huracán",
      price: "$208,571",
      specs: {
        speed: "202 mph",
        acceleration: "2.8s",
        power: "631 hp",
      },
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      
      <section id="vehicles" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredVehicles.map((vehicle, index) => (
              <VehicleCard key={index} {...vehicle} />
            ))}
          </div>
        </div>
      </section>

      <Services />
      <Footer />
    </div>
  );
};

export default Index;