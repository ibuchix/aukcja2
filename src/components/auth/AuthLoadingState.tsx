
import { Loader2 } from "lucide-react";
import { ClearAuthStateButton } from "@/components/auth/ClearAuthStateButton";

interface AuthLoadingStateProps {
  isLoadingTimeout: boolean;
  forceShowLogin: () => void;
}

export function AuthLoadingState({ isLoadingTimeout, forceShowLogin }: AuthLoadingStateProps) {
  return (
    <div className="container flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <div className="text-muted-foreground">Preparing login form...</div>
      
      {isLoadingTimeout && (
        <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-md max-w-md">
          <h3 className="font-medium text-yellow-800">Taking longer than expected</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Authentication is taking longer than usual. You can try refreshing the page
            or clearing your authentication state.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm rounded-md transition-colors"
            >
              Refresh Page
            </button>
            <ClearAuthStateButton />
            <button
              onClick={forceShowLogin}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm rounded-md transition-colors"
            >
              Force Login Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
