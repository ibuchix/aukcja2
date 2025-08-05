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

  // Only show if user is not authenticated and banner hasn't been dismissed
  if (!isInitialized || isLoading || isAuthenticated || isDismissed) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground py-3 px-4 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-center">
          <p className="text-sm md:text-base font-medium">
            🎉 <span className="font-bold">50% OFF</span> for new dealers who sign up now! 
            <span className="ml-2 hidden sm:inline">Limited time offer - Don't miss out!</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/auth?tab=signup" 
            className="bg-white text-primary px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Sign Up Now
          </Link>
          <button
            onClick={handleDismiss}
            className="text-primary-foreground hover:text-gray-200 transition-colors"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;