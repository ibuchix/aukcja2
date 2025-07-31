import { FacebookLogo, InstagramLogo, TwitterLogo, TiktokLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img 
              src="/lovable-uploads/f1a2bf02-fb76-4c66-af8f-e810114d6548.png" 
              alt="Autaro Logo" 
              className="h-12 w-auto mb-4"
            />
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Szybkie linki</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-primary">Strona Główna</Link></li>
              <li><Link to="/marketplace" className="text-gray-400 hover:text-primary">Aukcja</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-primary">Kontakt</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Aleje Jerozolimskie 123</li>
              <li>Warsaw, Poland 00-001</li>
              <li>+48 123 456 789</li>
              <li>dealerzy@autaro.pl</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Obserwuj nas</h4>
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
              <Link to="#" className="text-gray-400 hover:text-primary">
                <TiktokLogo size={24} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Autaro. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;