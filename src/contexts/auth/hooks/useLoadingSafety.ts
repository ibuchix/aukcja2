
import { useEffect } from "react";

/**
 * Hook to ensure auth loading state doesn't get stuck
 */
export function useLoadingSafety(
  isLoading: boolean,
  setIsLoading: (isLoading: boolean) => void
) {
  useEffect(() => {
    if (!isLoading) return;
    
    const safetyTimeout = setTimeout(() => {
      console.warn("Auth state safety timeout triggered - forcing loading state to false");
      setIsLoading(false);
    }, 8000); // 8 second maximum loading time
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, setIsLoading]);
}
