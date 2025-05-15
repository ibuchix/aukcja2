
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, Menu } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll events to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || location.pathname !== "/"
          ? "bg-white shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Home link - Using Link component to prevent page reload */}
        <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
          <img src="/car-auction-logo.svg" alt="Logo" className="h-8 w-auto" />
          <span>Car Auctions</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/auctions" className="text-gray-700 hover:text-primary transition-colors">
            Browse Auctions
          </Link>
          <Link to="/how-it-works" className="text-gray-700 hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link to="/help" className="text-gray-700 hover:text-primary transition-colors">
            Help
          </Link>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle size={18} />
                  {user?.email?.split('@')[0] || 'Account'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dealer/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dealer/profile" className="cursor-pointer w-full">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu />
        </Button>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md py-4 md:hidden">
            <div className="flex flex-col space-y-3 px-4">
              <Link 
                to="/auctions" 
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse Auctions
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                to="/help" 
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Help
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dealer/dashboard" 
                    className="text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/dealer/profile" 
                    className="text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-0"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
