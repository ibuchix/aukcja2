import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Załóż konto dealera",
      description: "Zarejestruj się jako dealer w naszym systemie. Proces jest szybki i bezpłatny - wystarczy kilka minut aby rozpocząć.",
      image: "/lovable-uploads/07777f71-e054-4c81-89b9-8cfa9236de87.png",
      alt: "Rejestracja konta dealera na telefonie"
    },
    {
      id: 2,
      title: "Przeglądaj Aukcje i Szukaj Okazji!",
      description: "Odkryj szeroki wybór pojazdów na aukcjach. Używaj filtrów aby znaleźć dokładnie to, czego szukasz.",
      image: "/lovable-uploads/92128f50-8e2a-4033-a415-a8521467bdd5.png",
      alt: "Przeglądanie aukcji samochodów na laptopie"
    },
    {
      id: 3,
      title: "Wygraj Licytacje i odbierz Samochód!",
      description: "Licytuj swoje wymarzone pojazdy i finalizuj zakup. Bezpieczne transakcje i sprawny proces odbioru.",
      image: "/lovable-uploads/13cf1931-bc2c-436f-86f2-db48c5f32137.png",
      alt: "Finalizacja zakupu samochodu"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-body-text">
            Jak to Działa
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group"
            >
              <div style={{backgroundColor: '#393B39'}} className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-primary/10">
                {/* Step Number */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-md mb-6 mx-auto">
                  <span className="w-8 h-8 text-primary font-bold text-lg flex items-center justify-center">
                    {step.id}
                  </span>
                </div>

                {/* Image Container */}
                <div className="relative overflow-hidden rounded-xl mb-6 aspect-[3/2] bg-secondary/10">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4 text-body-text group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-subtitle-text leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;