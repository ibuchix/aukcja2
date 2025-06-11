
import React from 'react';
import { CarSearch } from './CarSearch';
import { useDealerProfileSimple } from '@/hooks/useDealerProfileSimple';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CarSearchWrapper() {
  const { dealerProfile, isLoading, error, retryFetch, profileExists } = useDealerProfileSimple();
  const navigate = useNavigate();
  
  // Show loading state
  if (isLoading) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Loading Vehicle Search</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading your dealer profile...</span>
            </div>
          </CardContent>
        </Card>
        {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
      </>
    );
  }
  
  // Show error state with retry option
  if (error && !profileExists) {
    return (
      <>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Loading Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{error}</p>
            <div className="flex gap-2">
              <Button onClick={retryFetch} variant="outline" size="sm">
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/complete-registration')} 
                variant="outline" 
                size="sm"
              >
                Complete Registration
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
      </>
    );
  }
  
  // Show profile setup required
  if (!profileExists && !isLoading) {
    return (
      <>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <UserCircle2 className="h-5 w-5 mr-2" />
              Profile Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              You need to complete your dealer profile before you can search for vehicles.
            </p>
            <Button 
              onClick={() => navigate('/complete-registration')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Complete Your Profile
            </Button>
          </CardContent>
        </Card>
        {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
      </>
    );
  }
  
  // Profile loaded successfully - render car search
  return (
    <>
      <CarSearch dealerId={dealerProfile?.id} />
      {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
    </>
  );
}
