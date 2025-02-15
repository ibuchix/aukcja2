
import { Link } from "react-router-dom";
import { Compass, User, LayoutDashboard, HelpCircle } from "lucide-react";

interface NavbarDesktopMenuProps {
  session: any;
  handleLogout: () => Promise<void>;
}

export const NavbarDesktopMenu = ({ session, handleLogout }: NavbarDesktopMenuProps) => {
  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link to="/dealer/dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
        <LayoutDashboard size={20} />
        Dashboard
      </Link>
      <Link to="/auctions" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
        <Compass size={20} />
        Browse Vehicles
      </Link>
      <Link to="/how-it-works" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
        <HelpCircle size={20} />
        How It Works
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
  );
};
