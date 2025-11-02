
import { ClearAuthStateButton } from "@/components/auth/ClearAuthStateButton";
import { translateErrorMessage, translateUILabel } from "@/lib/vehicleTranslations";

export function AuthErrorState() {
  return (
    <div className="container flex items-center justify-center h-screen">
      <div className="p-4 border border-red-200 bg-red-50 rounded-md max-w-md">
        <h3 className="font-medium text-red-800">{translateErrorMessage('Authentication Error')}</h3>
        <p className="text-sm text-red-700 mt-1">
          {translateErrorMessage('There was a problem initializing the authentication system. Please try refreshing the page.')}
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded-md transition-colors"
          >
            {translateUILabel('Refresh Page')}
          </button>
          <ClearAuthStateButton />
        </div>
      </div>
    </div>
  );
}
