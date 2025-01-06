import { Link } from "react-router-dom";
import { Compass, User } from "@phosphor-icons/react";

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
        <Link to="/marketplace" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          <Compass size={20} weight="bold" />
          Browse Vehicles
        </Link>
        <Link to="/dealer/dashboard" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
          My Bids
        </Link>
        {session ? (
          <>
            <Link to="/dealer/profile" className="block text-gray-700 hover:text-primary py-2 flex items-center gap-2">
              <User size={20} weight="bold" />
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
            <User size={20} weight="bold" />
            Sign Up
          </Link>
        )}
      </div>
    </div>
  );
};