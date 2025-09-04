import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDDoSProtection } from '@/hooks/useDDoSProtection';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity } from "lucide-react";

interface DDoSProtectionContextType {
  isProtected: boolean;
  emergencyMode: any;
  systemHealth: any;
  recentThreats: any[];
  loading: boolean;
  checkRateLimit: (request: any) => Promise<any>;
  protectedRequest: <T>(fn: () => Promise<T>, config: any) => Promise<T | null>;
  threatLevel: 'low' | 'medium' | 'high';
  systemStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

const DDoSProtectionContext = createContext<DDoSProtectionContextType | undefined>(undefined);

export const useDDoSProtectionContext = () => {
  const context = useContext(DDoSProtectionContext);
  if (!context) {
    throw new Error('useDDoSProtectionContext must be used within a DDoSProtectionProvider');
  }
  return context;
};

interface DDoSProtectionProviderProps {
  children: React.ReactNode;
  config?: {
    enabled?: boolean;
    autoBlock?: boolean;
    suspicionThreshold?: number;
    rateLimitMultiplier?: number;
    showNotifications?: boolean;
  };
}

export const DDoSProtectionProvider: React.FC<DDoSProtectionProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const {
    enabled = true,
    autoBlock = true,
    suspicionThreshold = 70,
    rateLimitMultiplier = 1.0,
    showNotifications = true
  } = config;

  const protection = useDDoSProtection({
    enabled,
    autoBlock,
    suspicionThreshold,
    rateLimitMultiplier
  });

  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [showThreatAlert, setShowThreatAlert] = useState(false);

  // Show alerts for emergency mode and high threats
  useEffect(() => {
    if (showNotifications) {
      setShowEmergencyAlert(protection.isEmergencyActive);
      setShowThreatAlert(protection.threatLevel === 'high');
    }
  }, [protection.isEmergencyActive, protection.threatLevel, showNotifications]);

  const value: DDoSProtectionContextType = {
    isProtected: protection.isProtected,
    emergencyMode: protection.emergencyMode,
    systemHealth: protection.systemHealth,
    recentThreats: protection.recentThreats,
    loading: protection.loading,
    checkRateLimit: protection.checkRateLimit,
    protectedRequest: protection.protectedRequest,
    threatLevel: protection.threatLevel,
    systemStatus: protection.systemStatus
  };

  return (
    <DDoSProtectionContext.Provider value={value}>
      <div className="min-h-screen">
        {/* Emergency Mode Alert */}
        {showNotifications && showEmergencyAlert && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Emergency Mode Active:</strong> {protection.emergencyMode?.mode_type}
                <Badge variant="destructive" className="ml-2">CRITICAL</Badge>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* High Threat Alert */}
        {showNotifications && showThreatAlert && !showEmergencyAlert && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>High Threat Activity Detected:</strong> {protection.recentThreats.length} active threats
                <Badge variant="secondary" className="ml-2">HIGH</Badge>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* System Status Indicator */}
        {showNotifications && enabled && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center space-x-2 bg-background border rounded-lg px-3 py-2 shadow-lg">
              {protection.loading ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className={`h-4 w-4 ${
                  protection.systemStatus === 'critical' ? 'text-red-500' :
                  protection.systemStatus === 'warning' ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
              )}
              <span className="text-sm">
                {protection.loading ? 'Checking...' : 
                 protection.isProtected ? 'Protected' : 'Monitoring'}
              </span>
              <Badge variant={
                protection.threatLevel === 'high' ? 'destructive' :
                protection.threatLevel === 'medium' ? 'secondary' : 'outline'
              } className="text-xs">
                {protection.threatLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}

        {children}
      </div>
    </DDoSProtectionContext.Provider>
  );
};