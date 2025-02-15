
import { Link } from "react-router-dom";
import { Compass, User, LayoutDashboard, HelpCircle } from "lucide-react";

interface NavbarMobileMenuProps {
  isOpen: boolean;
  session: any;
  handleLogout: () => Promise<void>;
}

export const NavbarMobileMenu = ({ isOpen, session, handleLogout }: NavbarMobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden pb-4">
      <div className="space-y-4">
        <Link to="/dealer/dashboard" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/auctions" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <Compass size={20} />
          Browse Vehicles
        </Link>
        <Link to="/how-it-works" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <HelpCircle size={20} />
          How It Works
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
  );
};
