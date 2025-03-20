
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormValidationErrorsProps {
  errors: string[];
  title?: string;
}

/**
 * Component to display form validation errors
 */
export function FormValidationErrors({ 
  errors, 
  title = "Validation Errors" 
}: FormValidationErrorsProps) {
  if (errors.length === 0) return null;
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {errors.length === 1 ? (
          <p>{errors[0]}</p>
        ) : (
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
