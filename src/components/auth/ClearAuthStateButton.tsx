
import { Button } from "@/components/ui/button";
import { useCompleteRegistration } from "@/hooks/registration/useCompleteRegistration";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ClearAuthStateButton() {
  const { clearAuthTokens } = useCompleteRegistration();
  const [isClearing, setIsClearing] = useState(false);
  
  const handleClearAuth = () => {
    setIsClearing(true);
    try {
      clearAuthTokens();
      // Reload the page to apply the changes
      setTimeout(() => {
        window.location.href = "/auth?tab=login";
      }, 1000);
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleClearAuth}
      disabled={isClearing}
      className="mt-2 text-xs"
    >
      {isClearing ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Clearing...
        </>
      ) : (
        "Fix Login Issues"
      )}
    </Button>
  );
}
