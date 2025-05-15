
import { Button } from "@/components/ui/button";
import { useCompleteRegistration } from "@/hooks/registration/useCompleteRegistration";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ClearAuthStateButton() {
  const { clearAuthTokens } = useCompleteRegistration();
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  
  const handleClearAuth = () => {
    setIsClearing(true);
    try {
      clearAuthTokens();
      
      toast({
        title: "Authentication reset",
        description: "Authentication state has been cleared. The page will reload shortly.",
      });
      
      // Reload the page to apply the changes
      setTimeout(() => {
        window.location.href = "/auth?tab=login";
      }, 1500);
    } catch (error) {
      console.error("Error clearing auth state:", error);
      setIsClearing(false);
      
      toast({
        title: "Reset failed",
        description: "Failed to clear authentication state. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleClearAuth}
      disabled={isClearing}
      className="text-xs px-3 py-1 h-auto"
    >
      {isClearing ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Resetting authentication...
        </>
      ) : (
        "Reset Authentication State"
      )}
    </Button>
  );
}
