
/**
 * Development-only session monitoring component
 */

import { useState, useEffect } from 'react';
import { SessionDebugger, SessionDebugInfo } from '@/utils/sessionDebugger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SessionMonitor = () => {
  const [logs, setLogs] = useState<SessionDebugInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const interval = setInterval(() => {
      const currentLogs = SessionDebugger.getLogs();
      setLogs(currentLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCapture = async () => {
    await SessionDebugger.captureSessionState('Manual Capture');
    setLogs(SessionDebugger.getLogs());
  };

  const latestLog = logs[logs.length - 1];

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-gray-900 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          Session Monitor
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-gray-700"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Button 
              onClick={handleCapture} 
              size="sm" 
              variant="outline"
              className="w-full text-xs"
            >
              Capture Session State
            </Button>
            
            {latestLog && (
              <div className="text-xs space-y-1">
                <div className="font-semibold">Latest Session:</div>
                <div className={`px-2 py-1 rounded ${latestLog.hasSession ? 'bg-green-800' : 'bg-red-800'}`}>
                  Status: {latestLog.hasSession ? 'Active' : 'None'}
                </div>
                <div>User: {latestLog.userId?.substring(0, 8) || 'None'}</div>
                <div>Token: {latestLog.tokenLength} chars</div>
                <div className={`${latestLog.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {latestLog.isExpired ? 'Expired' : 'Valid'}
                </div>
                <div className="text-gray-400">
                  {latestLog.contextInfo}
                </div>
              </div>
            )}
            
            <div className="text-xs">
              Total Logs: {logs.length}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
