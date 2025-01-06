import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavbarLogo } from "./navbar/NavbarLogo";
import { NavbarDesktopMenu } from "./navbar/NavbarDesktopMenu";
import { NavbarMobileMenu } from "./navbar/NavbarMobileMenu";
import { NavbarMobileButton } from "./navbar/NavbarMobileButton";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  supabase.auth.onAuthStateChange((event, currentSession) => {
    setSession(currentSession);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <NavbarLogo />
          <NavbarDesktopMenu session={session} handleLogout={handleLogout} />
          <NavbarMobileButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </div>
        <NavbarMobileMenu isOpen={isOpen} session={session} handleLogout={handleLogout} />
      </div>
    </nav>
  );
};

export default Navbar;