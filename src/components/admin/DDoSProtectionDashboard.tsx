import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye,
  Settings,
  Zap,
  TrendingUp,
  Users,
  Clock,
  BarChart
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface DDoSEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  target_endpoint?: string;
  created_at: string;
  details: any;
}

interface SystemHealth {
  metric_name: string;
  metric_value: number;
  status: 'healthy' | 'warning' | 'critical';
  created_at: string;
  threshold_value?: number;
}

interface EmergencyMode {
  active: boolean;
  mode_type?: string;
  activated_at?: string;
  auto_deactivate_at?: string;
}

const DDoSProtectionDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState<EmergencyMode>({ active: false });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ddos-monitor', {
        body: { endpoint: 'dashboard' }
      });

      if (error) throw error;

      setDashboardData(data);

      // Also fetch emergency mode status
      const { data: emergencyData, error: emergencyError } = await supabase.functions.invoke('emergency-mode-manager', {
        body: { action: 'status' }
      });

      if (!emergencyError && emergencyData) {
        setEmergencyMode({
          active: !!emergencyData.active_mode,
          mode_type: emergencyData.active_mode?.mode_type,
          activated_at: emergencyData.active_mode?.activated_at,
          auto_deactivate_at: emergencyData.active_mode?.auto_deactivate_at
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch DDoS protection data');
    } finally {
      setLoading(false);
    }
  };

  const activateEmergencyMode = async (mode_type: string, reason: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-mode-manager', {
        body: {
          action: 'activate',
          mode_type,
          reason,
          admin_id: 'current-admin-id', // Should be dynamic
          auto_deactivate_minutes: 60 // 1 hour default
        }
      });

      if (error) throw error;

      toast.success(`Emergency mode "${mode_type}" activated`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error activating emergency mode:', error);
      toast.error('Failed to activate emergency mode');
    }
  };

  const deactivateEmergencyMode = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-mode-manager', {
        body: {
          action: 'deactivate',
          admin_id: 'current-admin-id', // Should be dynamic
          reason: 'Manual deactivation from dashboard'
        }
      });

      if (error) throw error;

      toast.success('Emergency mode deactivated');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deactivating emergency mode:', error);
      toast.error('Failed to deactivate emergency mode');
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading DDoS Protection Dashboard...</p>
        </div>
      </div>
    );
  }

  const recentEvents = dashboardData?.events || [];
  const healthMetrics = dashboardData?.health || {};
  const topAttackers = dashboardData?.top_attackers || [];
  const analysis = dashboardData?.analysis || {};
  const activeThreats = dashboardData?.active_threats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DDoS Protection Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and threat analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchDashboardData} 
            variant="outline"
            disabled={loading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Emergency Mode Alert */}
      {emergencyMode.active && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Emergency Mode Active:</strong> {emergencyMode.mode_type}
              {emergencyMode.auto_deactivate_at && (
                <span className="ml-2 text-sm">
                  (Auto-deactivates at {new Date(emergencyMode.auto_deactivate_at).toLocaleString()})
                </span>
              )}
            </span>
            <Button 
              onClick={deactivateEmergencyMode}
              variant="destructive" 
              size="sm"
            >
              Deactivate
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeThreats?.threats_detected || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis?.total_events || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Attackers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topAttackers?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(healthMetrics).some((metrics: any) => 
                metrics.some((m: any) => m.status === 'critical')) ? 'CRITICAL' : 'HEALTHY'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Mode Controls */}
      {!emergencyMode.active && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Emergency Controls
            </CardTitle>
            <CardDescription>
              Activate emergency protection modes during attacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => activateEmergencyMode('enhanced_filtering', 'Proactive protection')}
                variant="outline"
                className="h-20 flex-col"
              >
                <Shield className="h-6 w-6 mb-2" />
                Enhanced Filtering
              </Button>
              <Button 
                onClick={() => activateEmergencyMode('selective_blocking', 'Targeted blocking')}
                variant="outline"
                className="h-20 flex-col"
              >
                <Eye className="h-6 w-6 mb-2" />
                Selective Blocking
              </Button>
              <Button 
                onClick={() => activateEmergencyMode('full_lockdown', 'Severe attack detected')}
                variant="destructive"
                className="h-20 flex-col"
              >
                <AlertTriangle className="h-6 w-6 mb-2" />
                Full Lockdown
              </Button>
              <Button 
                onClick={() => activateEmergencyMode('maintenance', 'Scheduled maintenance')}
                variant="outline"
                className="h-20 flex-col"
              >
                <Settings className="h-6 w-6 mb-2" />
                Maintenance Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="attackers">Top Attackers</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent DDoS Events</CardTitle>
              <CardDescription>Latest security events and threats detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent events</p>
                ) : (
                  recentEvents.map((event: DDoSEvent) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{event.event_type.replace('_', ' ').toUpperCase()}</span>
                          {event.source_ip && (
                            <code className="bg-muted px-2 py-1 rounded text-sm">{event.source_ip}</code>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.target_endpoint && `Target: ${event.target_endpoint} • `}
                          {new Date(event.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>System Health Metrics</CardTitle>
              <CardDescription>Current system performance and health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(healthMetrics).map(([metricName, metrics]: [string, any]) => {
                  const latestMetric = metrics[0];
                  if (!latestMetric) return null;
                  
                  return (
                    <div key={metricName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{metricName.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">
                          Last updated: {new Date(latestMetric.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getStatusColor(latestMetric.status)}`}>
                          {latestMetric.metric_value}
                        </div>
                        {latestMetric.threshold_value && (
                          <div className="text-sm text-muted-foreground">
                            Threshold: {latestMetric.threshold_value}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(healthMetrics).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No health metrics available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attackers">
          <Card>
            <CardHeader>
              <CardTitle>Top Attackers (24h)</CardTitle>
              <CardDescription>IP addresses with highest threat activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAttackers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No attackers detected</p>
                ) : (
                  topAttackers.map((attacker: any, index: number) => (
                    <div key={attacker.ip} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded font-medium">{attacker.ip}</code>
                          <div className="text-sm text-muted-foreground mt-1">
                            Last seen: {new Date(attacker.last_seen).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{attacker.total_events} events</div>
                        <div className="text-sm space-x-2">
                          <span className="text-red-600">{attacker.critical_events} critical</span>
                          <span className="text-yellow-600">{attacker.high_severity} high</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Attack Analysis (24h)</CardTitle>
              <CardDescription>Statistical breakdown of detected threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">By Event Type</h3>
                  <div className="space-y-2">
                    {Object.entries(analysis?.by_type || {}).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex justify-between">
                        <span>{type.replace('_', ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">By Severity</h3>
                  <div className="space-y-2">
                    {Object.entries(analysis?.by_severity || {}).map(([severity, count]: [string, any]) => (
                      <div key={severity} className="flex justify-between">
                        <span className={`${getStatusColor(severity)} font-medium`}>{severity}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DDoSProtectionDashboard;