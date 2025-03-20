
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SupabaseErrorUnion } from '@/utils/supabase/errorTypes';

/**
 * Example component demonstrating the error handling system
 */
export default function ErrorHandlingExample() {
  const [showError, setShowError] = useState(false);
  const { execute, data, error, isLoading } = useSupabaseQuery<any>();

  // Example function that will generate different types of errors
  async function triggerError(errorType: string) {
    switch (errorType) {
      case 'not-found':
        // Example of row not found error - wrap in a function that returns a Promise
        await execute(() => 
          Promise.resolve(supabase
            .from('cars')
            .select('*')
            .eq('id', 'non-existent-id')
            .single())
        );
        break;
        
      case 'permission':
        // Example of permission denied error
        await execute(() => 
          // Create a promise that returns the result of the query
          Promise.resolve(supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', 'some-id'))
        );
        break;
        
      case 'auth':
        // Example of authentication error
        await execute(() => 
          supabase.auth.getSession()
            .then(({ data }) => {
              if (!data.session) {
                throw new Error('Not authenticated');
              }
              return { data: data.session, error: null };
            })
        );
        break;
        
      case 'network':
        // Example of network error
        await execute(() => {
          return Promise.reject(new Error('Failed to fetch (network error)'));
        });
        break;
        
      default:
        // Generic error
        await execute(() => 
          Promise.resolve({ data: null, error: new Error('Generic error') })
        );
    }
  }

  // Format error for display
  function getErrorDisplay(error: SupabaseErrorUnion) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Type: {error.type}</AlertTitle>
        <AlertDescription>
          {error.message}
          {error.code && <div className="text-xs mt-1">Code: {error.code}</div>}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Error Handling Demo</CardTitle>
        <CardDescription>
          Test different error types to see how they are handled
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => triggerError('not-found')}
            variant="outline"
            disabled={isLoading}
          >
            Trigger Not Found Error
          </Button>
          
          <Button 
            onClick={() => triggerError('permission')}
            variant="outline"
            disabled={isLoading}
          >
            Trigger Permission Error
          </Button>
          
          <Button 
            onClick={() => triggerError('auth')}
            variant="outline"
            disabled={isLoading}
          >
            Trigger Auth Error
          </Button>
          
          <Button 
            onClick={() => triggerError('network')}
            variant="outline"
            disabled={isLoading}
          >
            Trigger Network Error
          </Button>
        </div>
        
        {error && showError && getErrorDisplay(error)}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => setShowError(!showError)} 
          variant="secondary"
          disabled={!error}
        >
          {showError ? 'Hide Error Details' : 'Show Error Details'}
        </Button>
      </CardFooter>
    </Card>
  );
}
