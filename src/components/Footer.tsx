import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Auto-Strada</h3>
            <p className="text-gray-400">
              Luxury vehicles for the discerning driver
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-primary">Home</a></li>
              <li><a href="#vehicles" className="text-gray-400 hover:text-primary">Vehicles</a></li>
              <li><a href="#services" className="text-gray-400 hover:text-primary">Services</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-primary">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>123 Luxury Lane</li>
              <li>Beverly Hills, CA 90210</li>
              <li>+1 (555) 123-4567</li>
              <li>info@autostrada.com</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary">
                <Facebook />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Instagram />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary">
                <Twitter />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Auto-Strada. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;