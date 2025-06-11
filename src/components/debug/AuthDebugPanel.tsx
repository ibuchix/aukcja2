
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDebugger, AuthDebugInfo } from '@/utils/authDebugger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AuthDebugPanel() {
  const [debugLogs, setDebugLogs] = useState<AuthDebugInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { user, session, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setDebugLogs(AuthDebugger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const captureCurrentState = async () => {
    await AuthDebugger.captureAuthState("Manual Capture");
    setDebugLogs(AuthDebugger.getLogs());
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Auth
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          Auth Debug Panel
          <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Current State:</strong>
          </div>
          <div>
            <Badge variant={user ? "default" : "destructive"}>
              {user ? "Authenticated" : "Not Auth"}
            </Badge>
          </div>
          <div>Session:</div>
          <div>{session ? "Active" : "None"}</div>
          <div>Loading:</div>
          <div>{isLoading ? "Yes" : "No"}</div>
          <div>Initialized:</div>
          <div>{isInitialized ? "Yes" : "No"}</div>
          <div>User ID:</div>
          <div className="truncate">{user?.id || "None"}</div>
        </div>
        
        <Button onClick={captureCurrentState} size="sm" className="w-full">
          Capture State
        </Button>
        
        <div className="border-t pt-2">
          <strong>Recent Logs:</strong>
          <div className="max-h-32 overflow-auto space-y-1 mt-1">
            {debugLogs.slice(-5).reverse().map((log, index) => (
              <div key={index} className="p-1 bg-gray-50 rounded text-xs">
                <div className="font-mono text-xs">
                  {log.timestamp.toLocaleTimeString()}
                </div>
                <div className="flex justify-between">
                  <span>Auth Ready:</span>
                  <Badge variant={log.authContextReady ? "default" : "destructive"} className="text-xs">
                    {log.authContextReady ? "Yes" : "No"}
                  </Badge>
                </div>
                {log.dealerExists !== undefined && (
                  <div className="flex justify-between">
                    <span>Dealer:</span>
                    <Badge variant={log.dealerExists ? "default" : "secondary"} className="text-xs">
                      {log.dealerExists ? "Exists" : "Missing"}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
