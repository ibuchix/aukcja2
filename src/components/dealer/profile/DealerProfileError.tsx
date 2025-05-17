
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DealerProfileErrorProps {
  error: string;
  refreshProfile: () => void;
}

export function DealerProfileError({ error, refreshProfile }: DealerProfileErrorProps) {
  const navigate = useNavigate();
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error loading profile</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          {error} 
          {error.includes("403") && " (This may be a permissions issue with Supabase RLS policies)"}
        </p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshProfile}
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
          >
            Return to Login
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
