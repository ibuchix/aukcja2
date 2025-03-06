
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavbarLogo } from "./navbar/NavbarLogo";
import { NavbarDesktopMenu } from "./navbar/NavbarDesktopMenu";
import { NavbarMobileMenu } from "./navbar/NavbarMobileMenu";
import { NavbarMobileButton } from "./navbar/NavbarMobileButton";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavbarLogo />
            <NavbarDesktopMenu session={session} handleLogout={handleLogout} />
            <NavbarMobileButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
          </div>
          <NavbarMobileMenu isOpen={isOpen} session={session} handleLogout={handleLogout} />
        </div>
      </nav>
      {/* Add a spacer div to prevent content from being hidden under the navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
