import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from "../_shared/cors.ts";

interface EmergencyModeRequest {
  action: 'activate' | 'deactivate' | 'status' | 'list';
  mode_type?: 'full_lockdown' | 'selective_blocking' | 'enhanced_filtering' | 'maintenance';
  reason?: string;
  config?: Record<string, any>;
  auto_deactivate_minutes?: number;
  admin_id?: string;
}

class EmergencyModeManager {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      'https://sdvakfhmoaoucmhbhwvy.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDc5MjU5MSwiZXhwIjoyMDUwMzY4NTkxfQ.kUg9cXdJ4VzKb2pvqB4IUfGRN6oZJ8xXmUaFKCM0eJI'
    );
  }

  async activateEmergencyMode(
    mode_type: string,
    admin_id: string,
    reason: string,
    config?: Record<string, any>,
    auto_deactivate_minutes?: number
  ) {
    try {
      console.log(`Activating emergency mode: ${mode_type} by ${admin_id}`);
      
      const { data, error } = await this.supabase
        .rpc('activate_emergency_mode', {
          p_mode_type: mode_type,
          p_activated_by: admin_id,
          p_reason: reason,
          p_config: config || null,
          p_auto_deactivate_minutes: auto_deactivate_minutes || null
        });

      if (error) {
        console.error('Emergency mode activation error:', error);
        throw error;
      }

      // Record system health metric about emergency activation
      await this.supabase.rpc('record_system_health_metric', {
        p_metric_name: 'emergency_mode_activations',
        p_metric_value: 1,
        p_threshold_value: 0 // Any emergency activation is noteworthy
      });

      return data;
    } catch (error) {
      console.error('Failed to activate emergency mode:', error);
      throw error;
    }
  }

  async deactivateEmergencyMode(admin_id: string, reason?: string) {
    try {
      console.log(`Deactivating emergency mode by ${admin_id}`);
      
      // Get current active emergency mode
      const { data: currentMode, error: fetchError } = await this.supabase
        .from('emergency_mode')
        .select('*')
        .eq('is_active', true)
        .order('activated_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!currentMode) {
        return { success: false, message: 'No active emergency mode found' };
      }

      // Deactivate current emergency mode
      const { error: updateError } = await this.supabase
        .from('emergency_mode')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', currentMode.id);

      if (updateError) {
        throw updateError;
      }

      // Log deactivation
      await this.supabase
        .from('ddos_events')
        .insert({
          event_type: 'emergency_triggered',
          severity: 'medium',
          details: {
            action: 'deactivated',
            mode_type: currentMode.mode_type,
            deactivated_by: admin_id,
            reason: reason || 'Manual deactivation',
            emergency_id: currentMode.id
          }
        });

      return {
        success: true,
        message: 'Emergency mode deactivated successfully',
        deactivated_mode: currentMode.mode_type
      };
    } catch (error) {
      console.error('Failed to deactivate emergency mode:', error);
      throw error;
    }
  }

  async getEmergencyModeStatus() {
    try {
      // Get current active mode
      const { data: activeMode, error: activeError } = await this.supabase
        .from('emergency_mode')
        .select('*')
        .eq('is_active', true)
        .order('activated_at', { ascending: false })
        .limit(1)
        .single();

      if (activeError && activeError.code !== 'PGRST116') {
        throw activeError;
      }

      // Get recent emergency mode history
      const { data: history, error: historyError } = await this.supabase
        .from('emergency_mode')
        .select('*')
        .order('activated_at', { ascending: false })
        .limit(10);

      if (historyError) {
        throw historyError;
      }

      // Check for auto-deactivation
      let autoDeactivationStatus = null;
      if (activeMode?.auto_deactivate_at) {
        const now = new Date();
        const autoDeactivateAt = new Date(activeMode.auto_deactivate_at);
        
        if (now >= autoDeactivateAt) {
          // Should be auto-deactivated
          await this.deactivateEmergencyMode('system', 'Auto-deactivation timer expired');
          autoDeactivationStatus = 'auto_deactivated';
        } else {
          autoDeactivationStatus = {
            scheduled: true,
            deactivates_at: activeMode.auto_deactivate_at,
            minutes_remaining: Math.ceil((autoDeactivateAt.getTime() - now.getTime()) / (1000 * 60))
          };
        }
      }

      return {
        active_mode: activeMode || null,
        auto_deactivation: autoDeactivationStatus,
        history: history || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get emergency mode status:', error);
      throw error;
    }
  }

  async listEmergencyModes() {
    return {
      available_modes: [
        {
          type: 'full_lockdown',
          description: 'Blocks all non-essential traffic. Only critical system functions allowed.',
          severity: 'critical',
          use_case: 'Severe DDoS attack, system compromise'
        },
        {
          type: 'enhanced_filtering',
          description: 'Applies stricter rate limits and enhanced pattern detection.',
          severity: 'high',
          use_case: 'Moderate attack, suspicious traffic patterns'
        },
        {
          type: 'selective_blocking',
          description: 'Blocks specific IPs or regions while maintaining normal operation.',
          severity: 'medium',
          use_case: 'Targeted attacks from specific sources'
        },
        {
          type: 'maintenance',
          description: 'Controlled access during system maintenance.',
          severity: 'low',
          use_case: 'Planned maintenance, system upgrades'
        }
      ],
      config_options: {
        full_lockdown: {
          allowed_ips: 'Array of IP addresses allowed during lockdown',
          admin_access_only: 'Boolean to restrict to admin users only'
        },
        selective_blocking: {
          blocked_ips: 'Array of IP addresses to block',
          blocked_countries: 'Array of country codes to block',
          blocked_user_agents: 'Array of user agent patterns to block'
        },
        enhanced_filtering: {
          rate_limit_multiplier: 'Multiplier for rate limits (0.1 = 10x stricter)',
          suspicion_threshold: 'Lower threshold for blocking (default 70)'
        },
        maintenance: {
          maintenance_message: 'Message to display to users',
          estimated_duration: 'Estimated maintenance duration in minutes'
        }
      }
    };
  }
}

const emergencyManager = new EmergencyModeManager();

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
      // Handle GET requests for status and list
      const endpoint = url.pathname.split('/').pop();
      
      switch (endpoint) {
        case 'status':
          const status = await emergencyManager.getEmergencyModeStatus();
          return new Response(JSON.stringify(status), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        case 'modes':
          const modes = await emergencyManager.listEmergencyModes();
          return new Response(JSON.stringify(modes), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        default:
          return new Response(JSON.stringify({ 
            error: 'Invalid endpoint',
            available: ['status', 'modes']
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    }

    if (req.method === 'POST') {
      const body: EmergencyModeRequest = await req.json();
      
      if (!body.action) {
        return new Response(JSON.stringify({ 
          error: 'Action required',
          available_actions: ['activate', 'deactivate', 'status', 'list']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      switch (body.action) {
        case 'activate':
          if (!body.mode_type || !body.admin_id || !body.reason) {
            return new Response(JSON.stringify({ 
              error: 'Missing required fields: mode_type, admin_id, reason'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const activationResult = await emergencyManager.activateEmergencyMode(
            body.mode_type,
            body.admin_id,
            body.reason,
            body.config,
            body.auto_deactivate_minutes
          );

          return new Response(JSON.stringify({
            success: true,
            result: activationResult,
            processing_time: performance.now() - requestStart
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'deactivate':
          if (!body.admin_id) {
            return new Response(JSON.stringify({ 
              error: 'admin_id is required for deactivation'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const deactivationResult = await emergencyManager.deactivateEmergencyMode(
            body.admin_id,
            body.reason
          );

          return new Response(JSON.stringify({
            success: true,
            result: deactivationResult,
            processing_time: performance.now() - requestStart
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        default:
          return new Response(JSON.stringify({ 
            error: 'Invalid action',
            available_actions: ['activate', 'deactivate']
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
    console.error('Emergency mode manager error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      processing_time: performance.now() - requestStart
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});