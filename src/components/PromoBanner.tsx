import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PromoBanner = () => {
  console.log('PromoBanner component is mounting!');
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Clear the dismissed state to test - remove this line later
    localStorage.removeItem('promo-banner-dismissed');
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
      <div className="bg-red-500 text-white py-3 px-4 relative z-30 hover:bg-red-600 transition-colors cursor-pointer border-2 border-yellow-400 mt-16">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-medium text-white">
              🎉 <span className="font-bold">50% OFF</span> for new dealers who sign up now! 
              <span className="ml-2 hidden sm:inline">Limited time offer - Don't miss out!</span>
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = '/auth?tab=signup';
            }}
            className="bg-white text-red-500 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors mr-4"
          >
            Sign Up Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
  );
};

export default PromoBanner;