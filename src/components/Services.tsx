import { Shield, Tool, Clock, Car } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Shield,
      title: "Premium Protection",
      description: "Comprehensive warranty coverage for your peace of mind",
    },
    {
      icon: Tool,
      title: "Expert Service",
      description: "Factory-trained technicians and state-of-the-art facilities",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock assistance whenever you need it",
    },
    {
      icon: Car,
      title: "Test Drive",
      description: "Schedule a test drive of your dream car today",
    },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <service.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;