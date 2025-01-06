import { FacebookLogo, InstagramLogo, TwitterLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Auto-Strada</h3>
            <p className="text-gray-400">
              Quality vehicles for the discerning driver
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-primary">Home</Link></li>
              <li><Link to="/marketplace" className="text-gray-400 hover:text-primary">Vehicles</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Aleje Jerozolimskie 123</li>
              <li>Warsaw, Poland 00-001</li>
              <li>+48 123 456 789</li>
              <li>info@autostrada.com</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link to="#" className="text-gray-400 hover:text-primary">
                <FacebookLogo size={24} weight="bold" />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-primary">
                <InstagramLogo size={24} weight="bold" />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-primary">
                <TwitterLogo size={24} weight="bold" />
              </Link>
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