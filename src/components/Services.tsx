import { Shield, Wrench, Clock, Car } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Car,
      title: "Tylko prywatni sprzedawcy",
      description: "Na Autaro.pl możliwość sprzedaży mają wyłącznie prywatni sprzedawcy — dzięki temu masz pewność, że każdy pojazd pochodzi od osoby prywatnej.",
    },
    {
      icon: Shield,
      title: "Precyzyjny algorytm wyceny",
      description: "Algorytm Autaro.pl wykorzystuje aktualne dane rynkowe, aby ustalać opłacalne ceny orientacyjne dla wszystkich aut dostępnych na naszych codziennych aukcjach.",
    },
    {
      icon: Clock,
      title: "Tylko auta z Polski",
      description: "Na naszych codziennych aukcjach dostępne są wyłącznie auta zarejestrowane w Polsce. Każdego dnia pojawia się nowa selekcja aut do licytacji.",
    },
    {
      icon: Wrench,
      title: "Bezpieczne zakupy",
      description: "Wszystkie profile dostępnych aut są przez nas weryfikowane, a dealerzy mają możliwość sprawdzenia auta przy odbiorze — jeszcze przed finalizacją zakupu.",
    },
  ];

  return (
    <section id="services" className="pt-8 pb-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-body-text">Dlaczego warto nas wybrać</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center space-y-6 h-full"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
                <service.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-body-text">{service.title}</h3>
              <p className="text-subtitle-text leading-relaxed flex-grow">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;