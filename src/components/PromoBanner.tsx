import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PromoBanner = () => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('promo-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('promo-banner-dismissed', 'true');
  };

  // Debug: Let's see what's happening with auth state
  console.log('PromoBanner Debug:', { 
    isInitialized, 
    isLoading, 
    isAuthenticated, 
    isDismissed 
  });

  // Only show if user is not authenticated and banner hasn't been dismissed
  // Temporarily removing isInitialized and isLoading checks to debug
  if (isAuthenticated || isDismissed) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground py-3 px-4 relative z-50 hover:bg-primary/90 transition-colors cursor-pointer">
      <Link to="/auth?tab=signup" className="block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-medium text-primary-foreground">
              🎉 <span className="font-bold">50% OFF</span> for new dealers who sign up now! 
              <span className="ml-2 hidden sm:inline">Limited time offer - Don't miss out!</span>
            </p>
          </div>
        </div>
      </Link>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-foreground hover:text-gray-200 transition-colors"
        aria-label="Close banner"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default PromoBanner;