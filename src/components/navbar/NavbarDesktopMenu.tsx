
import { Link } from "react-router-dom";
import { LayoutDashboard, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarDesktopMenuProps {
  session: any;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
}

export const NavbarDesktopMenu = ({ session, isLoading, handleLogout }: NavbarDesktopMenuProps) => {
  return (
    <div className="hidden md:flex items-center space-x-8">
      {session && (
        <Link to="/dealer/dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
          <LayoutDashboard size={20} />
          Aukcja
        </Link>
      )}
      <Link to="/how-it-works" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
        <HelpCircle size={20} />
        Jak to Działa
      </Link>
      
      {isLoading ? (
        <Button disabled className="px-4 py-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
      ) : session ? (
        <Button
          onClick={handleLogout}
          variant="outline"
          className="px-4 py-2"
        >
          Logout
        </Button>
      ) : (
        <Link to="/auth?tab=login" className="btn-primary">
          Sign In
        </Link>
      )}
    </div>
  );
}
