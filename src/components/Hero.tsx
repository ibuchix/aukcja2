import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&q=80",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-dark leading-tight">
              Buy <span className="text-primary">high quality cars</span> for your dealership,
              <br />
              directly from private sellers
            </h1>
            <p className="text-subtitle-text text-lg max-w-2xl">
              Discover direct and fastest growing way to purchase cars on online
              auctions, exclusively from a wide selection of private sellers.
            </p>
            <div className="flex gap-4">
              <a
                href="#vehicles"
                className="btn-primary text-lg px-8 py-3"
              >
                Sign up now
              </a>
            </div>
          </div>
          <div className="relative">
            <img
              src="/lovable-uploads/77d4932b-acbe-4d45-8b3e-ba3304cf4491.png"
              alt="Car illustration"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Brand Logos Section */}
      <div className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-8 items-center justify-items-center">
            {/* Add car brand logos here */}
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/bmw.png" alt="BMW" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/mercedes.png" alt="Mercedes" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/audi.png" alt="Audi" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/volkswagen.png" alt="Volkswagen" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/porsche.png" alt="Porsche" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/toyota.png" alt="Toyota" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/honda.png" alt="Honda" className="h-12 opacity-80 grayscale brightness-200" />
            <img src="https://www.car-logos.org/wp-content/uploads/2011/09/ford.png" alt="Ford" className="h-12 opacity-80 grayscale brightness-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;