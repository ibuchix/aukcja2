
import { Link } from "react-router-dom";
import { Compass, LayoutDashboard, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarMobileMenuProps {
  isOpen: boolean;
  session: any;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
}

export const NavbarMobileMenu = ({ isOpen, session, isLoading, handleLogout }: NavbarMobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden pb-4">
      <div className="space-y-4">
        {session && (
          <Link to="/dealer/dashboard" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
        )}
        <Link to="/browse-cars" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <Compass size={20} />
          Browse Cars
        </Link>
        <Link to="/how-it-works" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <HelpCircle size={20} />
          How It Works
        </Link>
        
        {isLoading ? (
          <Button disabled className="block w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        ) : session ? (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="block w-full"
          >
            Logout
          </Button>
        ) : (
          <Link to="/auth" className="block w-full btn-primary text-center">
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
