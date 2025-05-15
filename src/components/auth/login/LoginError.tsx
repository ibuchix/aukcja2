
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginErrorProps {
  error: string | null;
  loginAttempted: boolean;
}

export function LoginError({ error, loginAttempted }: LoginErrorProps) {
  // If there's no error or login wasn't attempted yet, don't render
  if (!error) return null;

  return (
    <div className="space-y-4">
      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
        {error}
      </div>
      
      {/* Show additional help if login failed */}
      {loginAttempted && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your password may have been saved with extra whitespace. Try typing your password manually instead of using autofill.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
