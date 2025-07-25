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
      description: "Algorytm wykorzystuje aktualne dane rynkowe, aby ustalać opłacalne ceny orientacyjne dla wszystkich aut na codziennych aukcjach.",
    },
    {
      icon: Clock,
      title: "Tylko auta z Polski",
      description: "Na codziennych aukcjach dostępne są wyłącznie auta zarejestrowane w Polsce. Każdego dnia nowa selekcja do licytacji.",
    },
    {
      icon: Wrench,
      title: "Bezpieczne zakupy",
      description: "Weryfikujemy wszystkie profile aut. Dealerzy mogą sprawdzić auto przy odbiorze przed finalizacją zakupu.",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Dlaczego warto nas wybrać</h2>
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