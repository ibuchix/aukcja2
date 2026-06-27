
import { Link } from "react-router-dom";
import { LayoutDashboard, HelpCircle, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";

interface NavbarDesktopMenuProps {
  session: any;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
}

export const NavbarDesktopMenu = ({ session, isLoading, handleLogout }: NavbarDesktopMenuProps) => {
  const { isActive, isLoading: subLoading } = useDealerSubscription();
  const showNudge = !!session && !subLoading && !isActive;
  return (
    <div className="hidden md:flex items-center space-x-8">
      {session && (
        <Link to="/dealer/dashboard" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
          <LayoutDashboard size={20} />
          Aukcja
        </Link>
      )}
      {session && (
        <Link to="/dealer/subscription" className="relative text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
          <span className="relative inline-flex">
            <CreditCard size={20} />
            {showNudge && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
              </span>
            )}
          </span>
          {showNudge ? "Subskrybuj" : "Subskrypcja"}
        </Link>
      )}
      {/* Temporarily hidden — keep for future restoration
      <Link to="/how-it-works" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2">
        <HelpCircle size={20} />
        Jak to Działa
      </Link>
      */}

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
