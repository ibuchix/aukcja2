import { Shield, Wrench, Clock, Car } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Car,
      title: "The best stock everyday",
      description: "Fresh inventory of quality vehicles added daily for your dealership needs.",
    },
    {
      icon: Shield,
      title: "Market leading profits",
      description: "Access competitive pricing that helps maximize your profit margins.",
    },
    {
      icon: Clock,
      title: "The right price",
      description: "Transparent pricing with no hidden fees or surprise charges.",
    },
    {
      icon: Wrench,
      title: "100% online purchasing",
      description: "Complete your transactions entirely online with our secure platform.",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-4 p-6"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="text-subtitle-text">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="relative">
            <div className="absolute -left-4 top-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</div>
            <h3 className="text-xl font-semibold mb-4 pl-6">Browse through our stock</h3>
            <p className="text-subtitle-text pl-6">Explore our extensive collection of quality vehicles from verified sellers.</p>
          </div>
          <div className="relative">
            <div className="absolute -left-4 top-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</div>
            <h3 className="text-xl font-semibold mb-4 pl-6">Bid easily online</h3>
            <p className="text-subtitle-text pl-6">Place competitive bids on vehicles that match your inventory needs.</p>
          </div>
          <div className="relative">
            <div className="absolute -left-4 top-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</div>
            <h3 className="text-xl font-semibold mb-4 pl-6">Close the purchase</h3>
            <p className="text-subtitle-text pl-6">Complete your transaction securely through our platform.</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <h2 className="text-3xl font-bold text-center mb-12">See what our dealers have to say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-accent">
              <p className="text-subtitle-text mb-4">
                "Auto-Strada has transformed how we source our inventory. The process is seamless and the quality of vehicles is outstanding."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full" />
                <div>
                  <h4 className="font-semibold">John Smith</h4>
                  <p className="text-subtitle-text text-sm">Premium Motors</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;