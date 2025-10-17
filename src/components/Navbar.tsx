
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDealerProfile } from "@/contexts/dealer-profile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, Menu, LayoutDashboard } from "lucide-react";
import { NavbarLogo } from "./navbar/NavbarLogo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { displayProfile } = useDealerProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { toast } = useToast();

  // Get display name - prioritize dealership name for dealers
  const getDisplayName = () => {
    if (displayProfile?.dealership_name) {
      return displayProfile.dealership_name;
    }
    return user?.email?.split('@')[0] || 'Account';
  };

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

  // Enhanced logout with session validation and cleanup
  const handleLogout = async () => {
    try {
      console.log("🚪 Logout button clicked - starting enhanced logout");
      
      // Use the auth context signOut which now has proper session validation
      const result = await signOut();
      
      if (result.success) {
        console.log("✅ Context signOut successful");
        
        // Toast: Logged Out Successfully - User successfully logged out
        toast({
          description: "Zostałeś wylogowano pomyślnie",
        });
        
        // Navigate to auth page
        console.log("🚀 Navigating to auth page");
        navigate("/auth", { replace: true });
      } else {
        console.error("❌ Context signOut failed:", result.error);
        // Toast: Logout Failed - Error during logout
        toast({
          description: result.error || "Nie udało się wylogować",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("❌ Logout exception:", error);
      
      // Even on error, try to navigate to auth page for safety
      // Toast: Logout Completed - User logged out with auth cleanup
      toast({
        description: "Zostałeś wylogowany (z wyczyszczeniem danych)",
      });
      navigate("/auth", { replace: true });
    }
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || location.pathname !== "/"
          ? "bg-background/95 backdrop-blur-sm shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Home link */}
        <NavbarLogo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Dashboard Link - Prominently displayed for authenticated users */}
          {isAuthenticated && (
            <Link 
              to="/dealer/dashboard" 
              className="text-body-text hover:text-primary transition-colors flex items-center gap-2 font-medium"
            >
              <LayoutDashboard size={18} />
              Aukcja
            </Link>
          )}
          
          <Link to="/how-it-works" className="text-body-text hover:text-primary transition-colors">
            Jak to Działa
          </Link>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle size={18} />
                  {getDisplayName()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Moje Konto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dealer/profile" className="cursor-pointer w-full text-gray-400 hover:text-primary">Mój Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Wyloguj</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button>Zaloguj się</Button>
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
          <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-sm shadow-md py-4 md:hidden">
            <div className="flex flex-col space-y-3 px-4">
              {/* Dashboard Link - Mobile */}
              {isAuthenticated && (
                <Link 
                  to="/dealer/dashboard" 
                  className="text-body-text hover:text-primary transition-colors flex items-center gap-2 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  Aukcja
                </Link>
              )}
              
              <Link 
                to="/how-it-works" 
                className="text-body-text hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Jak to Działa
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dealer/profile" 
                    className="text-gray-400 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mój Profil
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
                    <span>Wyloguj</span>
                  </Button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button>Zaloguj się</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
