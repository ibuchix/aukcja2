
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function SessionExpiredNotice() {
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  
  if (!isExpired) return null;
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Session Expired</AlertTitle>
      <AlertDescription>
        Your session has expired for security reasons. Please sign in again to continue.
      </AlertDescription>
    </Alert>
  );
}
