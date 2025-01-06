import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, DollarSign, User, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  supabase.auth.onAuthStateChange((event, currentSession) => {
    setSession(currentSession);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/aa669890-4367-45e2-993a-634d24895446.png" 
                alt="Auto-Strada Logo" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-dark">AUTO-STRADA</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/marketplace" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
              <Navigation size={20} />
              Browse Vehicles
            </Link>
            <Link to="/dealer/dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
              <DollarSign size={20} />
              My Bids
            </Link>
            {session ? (
              <div className="flex items-center space-x-4">
                <Link to="/dealer/profile" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
                  <User size={20} />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-primary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary flex items-center gap-2">
                <User size={20} />
                Sign Up
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-4">
              <Link to="/marketplace" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
                <Navigation size={20} />
                Browse Vehicles
              </Link>
              <Link to="/dealer/dashboard" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
                <DollarSign size={20} />
                My Bids
              </Link>
              {session ? (
                <>
                  <Link to="/dealer/profile" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
                    <User size={20} />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left btn-primary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" className="block w-full btn-primary flex items-center gap-2">
                  <User size={20} />
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;