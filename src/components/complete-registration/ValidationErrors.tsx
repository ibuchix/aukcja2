
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

export function ValidationErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  
  return (
    <Alert variant="destructive" className="mb-6">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
