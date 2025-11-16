import { Shield, Clock, User, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Services = () => {
  const isMobile = useIsMobile();
  
  const services = [
    {
      icon: User,
      title: "Tylko prywatni sprzedawcy",
      description: "Na Autaro.pl możliwość sprzedaży mają wyłącznie prywatni sprzedawcy — dzięki temu masz pewność, że każdy pojazd pochodzi od osoby prywatnej.",
    },
    {
      icon: TrendingUp,
      title: "Precyzyjny algorytm wyceny",
      description: "Algorytm Autaro.pl wykorzystuje aktualne dane rynkowe, aby ustalać opłacalne ceny orientacyjne dla wszystkich aut dostępnych na naszych codziennych aukcjach.",
    },
    {
      icon: Clock,
      title: "Tylko auta z Polski",
      description: "Na naszych aukcjach dostępne są wyłącznie auta zarejestrowane w Polsce. Każdego tygodnia publikujemy nową selekcję pojazdów przeznaczonych do składania ofert. Oferty są prywatne i przekazywane sprzedającemu w czasie rzeczywistym.",
    },
    {
      icon: Shield,
      title: "Bezpieczne zakupy",
      description: "Wszystkie profile dostępnych aut są przez nas weryfikowane, a dealerzy mają możliwość sprawdzenia auta przy odbiorze — jeszcze przed finalizacją zakupu.",
    },
  ];

  return (
    <section id="services" className={`${isMobile ? 'pt-6 pb-16' : 'pt-8 pb-20'} bg-secondary`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-center mb-4 text-body-text`}>Dlaczego warto nas wybrać</h2>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6 mt-8' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12'}`}>
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${isMobile ? 'p-6' : 'p-8'} flex flex-col items-center text-center ${isMobile ? 'space-y-4' : 'space-y-6'} h-full`}
            >
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-primary/10 flex items-center justify-center shadow-md`}>
                <service.icon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary`} />
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-body-text`}>{service.title}</h3>
              <p className={`text-subtitle-text leading-relaxed flex-grow ${isMobile ? 'text-sm' : ''}`}>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;