
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { fixAllCarImageUrls, fixCarImageUrls, getStorageStatus } from "@/services/carImageService";
import { ensureCarImagesBucket } from "@/utils/storage/carImageStorage";

export const ImageFixUtility = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [storageStatus, setStorageStatus] = useState<any>(null);

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const [bucketStatus, storageInfo] = await Promise.all([
        ensureCarImagesBucket(),
        getStorageStatus()
      ]);
      
      setStorageStatus({
        ...storageInfo,
        bucketReady: bucketStatus
      });
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleFixAllImages = async () => {
    setIsFixing(true);
    setResults(null);
    
    try {
      const result = await fixAllCarImageUrls();
      setResults(result);
    } catch (error) {
      console.error('Error fixing images:', error);
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        results: []
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixSingleCar = async (carId: string) => {
    if (!carId.trim()) return;
    
    setIsFixing(true);
    try {
      const result = await fixCarImageUrls(carId.trim());
      setResults({
        success: result.success,
        message: result.message,
        results: [{ carId: carId.trim(), ...result }]
      });
    } catch (error) {
      console.error('Error fixing single car:', error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Car Image Fix Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Status */}
        <div className="space-y-2">
          <Button 
            onClick={handleCheckStatus} 
            disabled={isCheckingStatus}
            variant="outline"
            className="w-full"
          >
            {isCheckingStatus ? 'Checking...' : 'Check Storage Status'}
          </Button>
          
          {storageStatus && (
            <Alert variant={storageStatus.bucketExists ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Storage Status:</strong> {storageStatus.message}
                <br />
                <strong>Bucket Ready:</strong> {storageStatus.bucketReady ? 'Yes' : 'No'}
                <br />
                <strong>Cars with Images:</strong> {storageStatus.carsWithImages}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Fix All Images */}
        <div className="space-y-2">
          <Button 
            onClick={handleFixAllImages} 
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? 'Fixing...' : 'Fix All Car Image URLs'}
          </Button>
          
          <p className="text-sm text-gray-600">
            This will scan all cars and try to populate missing image URLs from storage.
          </p>
        </div>

        {/* Fix Single Car */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Car ID"
              className="flex-1 px-3 py-2 border rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFixSingleCar((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button 
              onClick={(e) => {
                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                handleFixSingleCar(input.value);
              }}
              disabled={isFixing}
              variant="outline"
            >
              Fix Single Car
            </Button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <Alert variant={results.success ? "default" : "destructive"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Results:</strong> {results.message}
              {results.results && results.results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.results.slice(0, 5).map((result: any, index: number) => (
                    <div key={index} className="text-xs">
                      Car {result.carId}: {result.success ? '✅' : '❌'} {result.message}
                    </div>
                  ))}
                  {results.results.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {results.results.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> This utility assumes images exist in Supabase Storage under the 'car-images' bucket. 
            If the bucket doesn't exist, it needs to be created by a database administrator.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
