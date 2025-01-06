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
    </section>
  );
};

export default Services;