import { useState } from "react";
import { Menu, X, Home, Grid, Mail, User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, currentSession) => {
    setSession(currentSession);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed w-full bg-secondary/90 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-primary">Auto-Strada</Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <Link to="/" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                <Home size={20} />
                Home
              </Link>
              <Link to="/marketplace" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                <Grid size={20} />
                Marketplace
              </Link>
              <Link to="/contact" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                <Mail size={20} />
                Contact
              </Link>
              {session ? (
                <>
                  <Link to="/dealer/dashboard" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                    <User size={20} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
                  <LogIn size={20} />
                  Sign Up
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary hover:text-primary/80"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block text-primary hover:text-primary/80 py-2 flex items-center gap-2">
                <Home size={20} />
                Home
              </Link>
              <Link to="/marketplace" className="block text-primary hover:text-primary/80 py-2 flex items-center gap-2">
                <Grid size={20} />
                Marketplace
              </Link>
              <Link to="/contact" className="block text-primary hover:text-primary/80 py-2 flex items-center gap-2">
                <Mail size={20} />
                Contact
              </Link>
              {session ? (
                <>
                  <Link to="/dealer/dashboard" className="block text-primary hover:text-primary/80 py-2 flex items-center gap-2">
                    <User size={20} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-primary hover:text-primary/80 py-2 w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" className="block text-primary hover:text-primary/80 py-2 flex items-center gap-2">
                  <LogIn size={20} />
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