import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-secondary/90 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-primary">Auto-Strada</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <a href="#" className="text-white hover:text-primary transition-colors">Home</a>
              <a href="#vehicles" className="text-white hover:text-primary transition-colors">Vehicles</a>
              <a href="#services" className="text-white hover:text-primary transition-colors">Services</a>
              <a href="#contact" className="text-white hover:text-primary transition-colors">Contact</a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#" className="block text-white hover:text-primary py-2">Home</a>
              <a href="#vehicles" className="block text-white hover:text-primary py-2">Vehicles</a>
              <a href="#services" className="block text-white hover:text-primary py-2">Services</a>
              <a href="#contact" className="block text-white hover:text-primary py-2">Contact</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;