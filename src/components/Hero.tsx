import { useEffect, useState } from "react";

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
    <div className="relative h-screen">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentImage === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}
      
      <div className="relative h-full flex items-center justify-center text-center">
        <div className="max-w-3xl px-4 animate-fadeIn">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Experience Luxury in Motion
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Discover our exclusive collection of premium vehicles
          </p>
          <a
            href="#vehicles"
            className="inline-block bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Explore Vehicles
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;