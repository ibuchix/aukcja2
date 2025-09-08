import { FacebookLogo, InstagramLogo, WhatsappLogo, TiktokLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const Footer = () => {
  return <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img 
              src="/lovable-uploads/f142b426-569e-4396-85a2-aaafcb8c3909.png" 
              alt="Autaro Logo" 
              className="h-12 w-auto mb-4"
            />
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Szybkie linki</h4>
            <ul className="space-y-2">
              <li><Link to="/" onClick={scrollToTop} className="text-gray-400 hover:text-primary">Strona Główna</Link></li>
              <li><Link to="/dealer/dashboard" onClick={scrollToTop} className="text-gray-400 hover:text-primary">Aukcja</Link></li>
              <li><Link to="/pricing" onClick={scrollToTop} className="text-gray-400 hover:text-primary">Cennik</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-gray-400">
              <li>+48 45 9567877</li>
              <li>dealerzy@autaro.pl</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Obserwuj nas</h4>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61561786643737" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <FacebookLogo size={24} weight="bold" />
              </a>
              <a href="https://www.instagram.com/autaro.pl/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <InstagramLogo size={24} weight="bold" />
              </a>
              <a href="https://whatsapp.com/channel/0029VbBcyG8ICVfnDPoIbr3Z" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <WhatsappLogo size={24} weight="bold" />
              </a>
              <a href="https://www.tiktok.com/@autaro.pl_?_t=ZN-8zYb25SoW06&_r=1" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <TiktokLogo size={24} weight="bold" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
            <Link to="/cookie-policy" onClick={scrollToTop} className="text-gray-400 hover:text-primary text-sm">
              Polityka plików cookie
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Autaro. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;