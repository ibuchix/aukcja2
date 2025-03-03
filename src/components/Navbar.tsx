
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavbarLogo } from "./navbar/NavbarLogo";
import { NavbarDesktopMenu } from "./navbar/NavbarDesktopMenu";
import { NavbarMobileMenu } from "./navbar/NavbarMobileMenu";
import { NavbarMobileButton } from "./navbar/NavbarMobileButton";
import { Session } from "@supabase/supabase-js";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the initial session state
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getInitialSession();

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Navbar auth state change:", event);
      setSession(currentSession);
    });

    // Cleanup the subscription when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Error during logout:", error);
    }
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
