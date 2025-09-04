import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from "../_shared/cors.ts";

interface DDoSAlert {
  type: 'rate_limit_exceeded' | 'pattern_detected' | 'burst_detected' | 'geographic_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  details: Record<string, any>;
  mitigation_suggested?: string;
}

class DDoSMonitor {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      'https://sdvakfhmoaoucmhbhwvy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc5MjU5MSwiZXhwIjoyMDUwMzY4NTkxfQ.kUg9cXdJ4VzKb2pvqB4IUfGRN6oZJ8xXmUaFKCM0eJI'
    );
  }

  async getDDoSEvents(filters: { 
    severity?: string, 
    timeRange?: string, 
    limit?: number,
    source_ip?: string 
  } = {}) {
    try {
      let query = this.supabase
        .from('ddos_events')
        .select('*');

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.source_ip) {
        query = query.eq('source_ip', filters.source_ip);
      }

      if (filters.timeRange) {
        const hours = parseInt(filters.timeRange) || 24;
        const since = new Date(Date.now() - hours * 3600000).toISOString();
        query = query.gte('created_at', since);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching DDoS events:', error);
      return [];
    }
  }

  async getSystemHealth(timeRange: string = '24') {
    try {
      const hours = parseInt(timeRange) || 24;
      const since = new Date(Date.now() - hours * 3600000).toISOString();

      const { data, error } = await this.supabase
        .from('system_health')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group by metric name for easier analysis
      const grouped = (data || []).reduce((acc, record) => {
        if (!acc[record.metric_name]) {
          acc[record.metric_name] = [];
        }
        acc[record.metric_name].push(record);
        return acc;
      }, {});

      return grouped;
    } catch (error) {
      console.error('Error fetching system health:', error);
      return {};
    }
  }

  async getTopAttackers(timeRange: string = '24', limit: number = 10) {
    try {
      const hours = parseInt(timeRange) || 24;
      const since = new Date(Date.now() - hours * 3600000).toISOString();

      const { data, error } = await this.supabase
        .from('ddos_events')
        .select('source_ip, severity, created_at')
        .gte('created_at', since)
        .not('source_ip', 'is', null);

      if (error) throw error;

      // Aggregate by IP address
      const ipStats = (data || []).reduce((acc, event) => {
        const ip = event.source_ip;
        if (!acc[ip]) {
          acc[ip] = {
            ip: ip,
            total_events: 0,
            high_severity: 0,
            critical_events: 0,
            last_seen: event.created_at
          };
        }
        
        acc[ip].total_events++;
        if (event.severity === 'high') acc[ip].high_severity++;
        if (event.severity === 'critical') acc[ip].critical_events++;
        
        if (new Date(event.created_at) > new Date(acc[ip].last_seen)) {
          acc[ip].last_seen = event.created_at;
        }
        
        return acc;
      }, {});

      return Object.values(ipStats)
        .sort((a: any, b: any) => b.total_events - a.total_events)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top attackers:', error);
      return [];
    }
  }

  async analyzeAttackPatterns(timeRange: string = '24') {
    try {
      const hours = parseInt(timeRange) || 24;
      const since = new Date(Date.now() - hours * 3600000).toISOString();

      const { data, error } = await this.supabase
        .from('ddos_events')
        .select('event_type, severity, created_at, details')
        .gte('created_at', since);

      if (error) throw error;

      const analysis = {
        total_events: data?.length || 0,
        by_type: {},
        by_severity: {},
        timeline: {},
        geographic_distribution: {}
      };

      (data || []).forEach(event => {
        // Count by type
        analysis.by_type[event.event_type] = (analysis.by_type[event.event_type] || 0) + 1;
        
        // Count by severity
        analysis.by_severity[event.severity] = (analysis.by_severity[event.severity] || 0) + 1;
        
        // Timeline (by hour)
        const hour = new Date(event.created_at).getHours();
        analysis.timeline[hour] = (analysis.timeline[hour] || 0) + 1;
        
        // Geographic (if available in details)
        if (event.details?.geographical_region) {
          const region = event.details.geographical_region;
          analysis.geographic_distribution[region] = (analysis.geographic_distribution[region] || 0) + 1;
        }
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing attack patterns:', error);
      return {
        total_events: 0,
        by_type: {},
        by_severity: {},
        timeline: {},
        geographic_distribution: {}
      };
    }
  }

  async checkActiveThreats() {
    try {
      // Check for ongoing attacks (events in last 10 minutes)
      const recentThreshold = new Date(Date.now() - 10 * 60000).toISOString();
      
      const { data: recentEvents, error } = await this.supabase
        .from('ddos_events')
        .select('*')
        .gte('created_at', recentThreshold)
        .in('severity', ['high', 'critical']);

      if (error) throw error;

      const activeThreats = {
        high_frequency_attacks: [],
        suspicious_ips: [],
        pattern_attacks: [],
        burst_attacks: []
      };

      // Analyze recent events
      (recentEvents || []).forEach(event => {
        switch (event.event_type) {
          case 'rate_limit_exceeded':
            activeThreats.high_frequency_attacks.push(event);
            break;
          case 'pattern_detected':
            activeThreats.pattern_attacks.push(event);
            break;
          case 'burst_detected':
            activeThreats.burst_attacks.push(event);
            break;
        }
        
        if (event.source_ip && event.severity === 'critical') {
          activeThreats.suspicious_ips.push(event.source_ip);
        }
      });

      return {
        threats_detected: recentEvents?.length || 0,
        active_threats: activeThreats,
        recommendation: this.getRecommendation(activeThreats)
      };
    } catch (error) {
      console.error('Error checking active threats:', error);
      return {
        threats_detected: 0,
        active_threats: {},
        recommendation: 'Monitor system normally'
      };
    }
  }

  private getRecommendation(threats: any): string {
    const totalThreats = Object.values(threats).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);
    
    if (totalThreats >= 10) {
      return 'CRITICAL: Consider activating emergency mode - full_lockdown';
    } else if (totalThreats >= 5) {
      return 'HIGH: Consider enhanced_filtering or selective_blocking';
    } else if (totalThreats >= 2) {
      return 'MEDIUM: Monitor closely and prepare mitigation';
    } else {
      return 'LOW: Continue normal monitoring';
    }
  }
}

const monitor = new DDoSMonitor();

serve(async (req) => {
  const requestStart = performance.now();
  const url = new URL(req.url);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method === 'GET') {
      const endpoint = url.pathname.split('/').pop();
      const params = Object.fromEntries(url.searchParams);

      switch (endpoint) {
        case 'events':
          const events = await monitor.getDDoSEvents(params);
          return new Response(JSON.stringify({ events }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'health':
          const health = await monitor.getSystemHealth(params.timeRange);
          return new Response(JSON.stringify({ health }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'attackers':
          const attackers = await monitor.getTopAttackers(
            params.timeRange, 
            parseInt(params.limit) || 10
          );
          return new Response(JSON.stringify({ attackers }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'analysis':
          const analysis = await monitor.analyzeAttackPatterns(params.timeRange);
          return new Response(JSON.stringify({ analysis }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'threats':
          const threats = await monitor.checkActiveThreats();
          return new Response(JSON.stringify({ threats }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'dashboard':
          // Combined dashboard data
          const [dashEvents, dashHealth, dashAttackers, dashAnalysis, dashThreats] = await Promise.all([
            monitor.getDDoSEvents({ timeRange: '24', limit: 20 }),
            monitor.getSystemHealth('24'),
            monitor.getTopAttackers('24', 5),
            monitor.analyzeAttackPatterns('24'),
            monitor.checkActiveThreats()
          ]);

          return new Response(JSON.stringify({
            events: dashEvents,
            health: dashHealth,
            top_attackers: dashAttackers,
            analysis: dashAnalysis,
            active_threats: dashThreats,
            timestamp: new Date().toISOString(),
            response_time: performance.now() - requestStart
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        default:
          return new Response(JSON.stringify({ 
            error: 'Invalid endpoint',
            available: ['events', 'health', 'attackers', 'analysis', 'threats', 'dashboard']
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Monitor error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      response_time: performance.now() - requestStart
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});