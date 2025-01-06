import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NavbarDesktopMenuProps {
  session: any;
  handleLogout: () => void;
}

export const NavbarDesktopMenu = ({ session, handleLogout }: NavbarDesktopMenuProps) => {
  return (
    <div className="hidden md:flex items-center space-x-4">
      <Link to="/marketplace" className="text-gray-700 hover:text-primary transition-colors">
        Marketplace
      </Link>
      {session ? (
        <>
          <Link to="/my-bids" className="text-gray-700 hover:text-primary transition-colors">
            My Bids (zł)
          </Link>
          <Button
            variant="ghost"
            className="text-gray-700 hover:text-primary transition-colors"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      ) : (
        <Link to="/auth">
          <Button variant="ghost" className="text-gray-700 hover:text-primary transition-colors">
            Login
          </Button>
        </Link>
      )}
    </div>
  );
};