
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Zap } from "lucide-react";
import { auctionStatusMonitor, AuctionStatusAlert } from "@/utils/auctionStatusMonitor";
import { useToast } from "@/hooks/use-toast";

export const AuctionStatusMonitor = () => {
  const [alerts, setAlerts] = useState<AuctionStatusAlert[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auctionStatusMonitor.subscribe(setAlerts);
    return unsubscribe;
  }, []);

  const handleVerifyConsistency = async () => {
    setIsVerifying(true);
    try {
      const result = await auctionStatusMonitor.verifyConsistency();
      toast({
        title: "Consistency Check Complete",
        description: `Checked ${result.total_checked} auctions, fixed ${result.automatically_fixed} issues`,
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify auction status consistency",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleForceSynchronization = async () => {
    setIsSyncing(true);
    try {
      const result = await auctionStatusMonitor.forceSynchronization();
      toast({
        title: "Synchronization Complete",
        description: `Updated ${result.updates || 0} auction statuses`,
      });
    } catch (error) {
      toast({
        title: "Synchronization Failed",
        description: "Failed to force auction status synchronization",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getSeverityColor = (severity: AuctionStatusAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: AuctionStatusAlert['severity']) => {
    return severity === 'critical' || severity === 'high' ? 
      <AlertCircle className="h-4 w-4" /> : 
      <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Auction Status Monitor
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyConsistency}
              disabled={isVerifying}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
              Verify Consistency
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSynchronization}
              disabled={isSyncing}
            >
              <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Force Sync
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No auction status alerts</p>
            <p className="text-sm">All auction statuses are synchronized</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Alerts ({alerts.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => auctionStatusMonitor.clearAlerts()}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">
                        {alert.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {alert.details && Object.keys(alert.details).length > 0 && (
                    <div className="bg-muted/50 rounded p-2">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(alert.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
