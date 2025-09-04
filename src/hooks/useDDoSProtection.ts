import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RateLimitRequest {
  identifier: string;
  endpoint: string;
  requests_per_minute?: number;
  burst_limit?: number;
}

interface RateLimitResult {
  allowed: boolean;
  current_count: number;
  burst_count: number;
  retry_after: number;
  suspicion_score: number;
  should_block: boolean;
  source: string;
  processing_time: number;
  emergency_mode?: {
    active: boolean;
    mode_type?: string;
  };
}

interface DDoSProtectionConfig {
  enabled: boolean;
  autoBlock: boolean;
  suspicionThreshold: number;
  rateLimitMultiplier: number;
}

export const useDDoSProtection = (config: DDoSProtectionConfig = {
  enabled: true,
  autoBlock: true,
  suspicionThreshold: 70,
  rateLimitMultiplier: 1.0
}) => {
  const [isProtected, setIsProtected] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [recentThreats, setRecentThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check rate limits before making requests
  const checkRateLimit = useCallback(async (request: RateLimitRequest): Promise<RateLimitResult | null> => {
    if (!config.enabled) {
      return {
        allowed: true,
        current_count: 0,
        burst_count: 0,
        retry_after: 0,
        suspicion_score: 0,
        should_block: false,
        source: 'disabled',
        processing_time: 0
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-rate-limiter', {
        body: {
          ...request,
          requests_per_minute: request.requests_per_minute ? 
            Math.floor(request.requests_per_minute * config.rateLimitMultiplier) : undefined,
          burst_limit: request.burst_limit ? 
            Math.floor(request.burst_limit * config.rateLimitMultiplier) : undefined
        }
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return null;
      }

      // Auto-block high suspicion requests if enabled
      if (config.autoBlock && data.suspicion_score >= config.suspicionThreshold) {
        toast.warning('Suspicious activity detected and blocked');
        return {
          ...data,
          allowed: false,
          should_block: true
        };
      }

      return data;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return null;
    }
  }, [config]);

  // Get current emergency mode status
  const getEmergencyStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-mode-manager', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Emergency status check failed:', error);
        return null;
      }

      setEmergencyMode(data.active_mode);
      return data;
    } catch (error) {
      console.error('Emergency status error:', error);
      return null;
    }
  }, []);

  // Get system health metrics
  const getSystemHealth = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ddos-monitor', {
        body: { endpoint: 'health', timeRange: '1' }
      });

      if (error) {
        console.error('Health check failed:', error);
        return null;
      }

      setSystemHealth(data.health);
      return data.health;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }, []);

  // Get recent threats
  const getRecentThreats = useCallback(async (timeRange: string = '1') => {
    try {
      const { data, error } = await supabase.functions.invoke('ddos-monitor', {
        body: { endpoint: 'threats' }
      });

      if (error) {
        console.error('Threat check failed:', error);
        return [];
      }

      setRecentThreats(data.threats?.active_threats || []);
      return data.threats;
    } catch (error) {
      console.error('Threat check error:', error);
      return [];
    }
  }, []);

  // Protected request wrapper
  const protectedRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    rateLimitConfig: RateLimitRequest
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      // Check rate limits first
      const rateLimitResult = await checkRateLimit(rateLimitConfig);
      
      if (rateLimitResult && !rateLimitResult.allowed) {
        const message = rateLimitResult.emergency_mode?.active 
          ? `Emergency mode active: ${rateLimitResult.emergency_mode.mode_type}`
          : `Rate limited. Try again in ${rateLimitResult.retry_after} seconds`;
        
        toast.error(message);
        return null;
      }

      // Proceed with the actual request
      const result = await requestFn();
      
      // Update protection status
      setIsProtected(true);
      
      return result;
    } catch (error) {
      console.error('Protected request failed:', error);
      toast.error('Request failed due to protection measures');
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkRateLimit]);

  // Auto-refresh protection status
  useEffect(() => {
    if (!config.enabled) return;

    const refreshStatus = async () => {
      await Promise.all([
        getEmergencyStatus(),
        getSystemHealth(),
        getRecentThreats()
      ]);
    };

    // Initial load
    refreshStatus();

    // Refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000);

    return () => clearInterval(interval);
  }, [config.enabled, getEmergencyStatus, getSystemHealth, getRecentThreats]);

  // Real-time monitoring setup
  useEffect(() => {
    if (!config.enabled) return;

    // Subscribe to DDoS events
    const channel = supabase
      .channel('ddos-protection')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ddos_events'
        },
        (payload) => {
          const event = payload.new;
          
          // Show toast for high severity events
          if (event.severity === 'high' || event.severity === 'critical') {
            toast.warning(`DDoS Event: ${event.event_type}`, {
              description: `Severity: ${event.severity} from ${event.source_ip || 'unknown'}`
            });
          }
          
          // Refresh recent threats
          getRecentThreats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_mode'
        },
        (payload) => {
          // Emergency mode changed
          getEmergencyStatus();
          
          if (payload.eventType === 'INSERT' && payload.new.is_active) {
            toast.error(`Emergency mode activated: ${payload.new.mode_type}`);
          } else if (payload.eventType === 'UPDATE' && !payload.new.is_active) {
            toast.success(`Emergency mode deactivated`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.enabled, getEmergencyStatus, getRecentThreats]);

  return {
    // State
    isProtected,
    emergencyMode,
    systemHealth,
    recentThreats,
    loading,
    
    // Methods
    checkRateLimit,
    protectedRequest,
    getEmergencyStatus,
    getSystemHealth,
    getRecentThreats,
    
    // Status helpers
    isEmergencyActive: !!emergencyMode?.is_active,
    threatLevel: (recentThreats.length >= 5 ? 'high' : recentThreats.length >= 2 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    systemStatus: (systemHealth ? 
      Object.values(systemHealth).some((metrics: any) => 
        metrics.some((m: any) => m.status === 'critical')) ? 'critical' : 'healthy' : 'unknown') as 'healthy' | 'warning' | 'critical' | 'unknown'
  };
};

export default useDDoSProtection;