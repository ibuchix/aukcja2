
import { supabase } from "@/integrations/supabase/client";

export interface AuctionStatusAlert {
  id: string;
  type: 'status_mismatch' | 'bid_failure' | 'sync_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: string;
}

export class AuctionStatusMonitor {
  private static instance: AuctionStatusMonitor;
  private alerts: AuctionStatusAlert[] = [];
  private listeners: ((alerts: AuctionStatusAlert[]) => void)[] = [];

  static getInstance(): AuctionStatusMonitor {
    if (!AuctionStatusMonitor.instance) {
      AuctionStatusMonitor.instance = new AuctionStatusMonitor();
    }
    return AuctionStatusMonitor.instance;
  }

  private constructor() {
    this.setupRealtimeMonitoring();
  }

  private setupRealtimeMonitoring() {
    // Monitor system logs for auction-related errors
    supabase
      .channel('auction-status-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs',
          filter: 'log_type=in.(auction_status_sync_error,bid_placement_error,invalid_status_transition)'
        },
        (payload) => {
          this.handleSystemLogAlert(payload.new);
        }
      )
      .subscribe();

    // Monitor auction schedule changes
    supabase
      .channel('auction-schedule-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction_schedules'
        },
        (payload) => {
          this.validateStatusTransition(payload.old, payload.new);
        }
      )
      .subscribe();
  }

  private handleSystemLogAlert(logEntry: any) {
    const alert: AuctionStatusAlert = {
      id: logEntry.id,
      type: this.mapLogTypeToAlertType(logEntry.log_type),
      severity: this.determineSeverity(logEntry.log_type, logEntry.error_message),
      message: logEntry.message || 'System alert',
      details: logEntry.details || {},
      timestamp: logEntry.created_at
    };

    this.addAlert(alert);
  }

  private validateStatusTransition(oldRecord: any, newRecord: any) {
    // Check for invalid status transitions
    if (oldRecord.status !== newRecord.status) {
      const now = new Date();
      const startTime = new Date(newRecord.start_time);
      const endTime = new Date(newRecord.end_time);

      let expectedStatus = 'scheduled';
      if (now >= startTime && now <= endTime) {
        expectedStatus = 'running';
      } else if (now > endTime) {
        expectedStatus = 'completed';
      }

      if (newRecord.status !== expectedStatus && newRecord.status !== 'cancelled') {
        const alert: AuctionStatusAlert = {
          id: `status-mismatch-${newRecord.id}-${Date.now()}`,
          type: 'status_mismatch',
          severity: 'medium',
          message: `Auction status mismatch detected`,
          details: {
            carId: newRecord.car_id,
            expectedStatus,
            actualStatus: newRecord.status,
            startTime: newRecord.start_time,
            endTime: newRecord.end_time
          },
          timestamp: new Date().toISOString()
        };

        this.addAlert(alert);
      }
    }
  }

  private mapLogTypeToAlertType(logType: string): AuctionStatusAlert['type'] {
    if (logType.includes('bid_placement')) return 'bid_failure';
    if (logType.includes('sync_error')) return 'sync_error';
    return 'status_mismatch';
  }

  private determineSeverity(logType: string, errorMessage: string): AuctionStatusAlert['severity'] {
    if (logType.includes('critical') || errorMessage?.includes('critical')) return 'critical';
    if (logType.includes('error')) return 'high';
    if (logType.includes('warning')) return 'medium';
    return 'low';
  }

  private addAlert(alert: AuctionStatusAlert) {
    this.alerts = [alert, ...this.alerts.slice(0, 99)]; // Keep last 100 alerts
    this.notifyListeners();

    console.warn('🚨 Auction Status Alert:', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      details: alert.details
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.alerts));
  }

  public subscribe(listener: (alerts: AuctionStatusAlert[]) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately provide current alerts
    listener(this.alerts);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getAlerts(): AuctionStatusAlert[] {
    return [...this.alerts];
  }

  public clearAlerts() {
    this.alerts = [];
    this.notifyListeners();
  }

  // Verify auction status consistency manually
  public async verifyConsistency(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('verify_auction_status_consistency');
      
      if (error) {
        console.error('Error verifying auction status consistency:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Exception in verifyConsistency:', error);
      return { success: false, error: 'Failed to verify consistency' };
    }
  }

  // Force auction status synchronization
  public async forceSynchronization(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('update_auction_status');
      
      if (error) {
        console.error('Error forcing auction synchronization:', error);
        return { success: false, error: error.message };
      }

      return { success: true, updates: data };
    } catch (error) {
      console.error('Exception in forceSynchronization:', error);
      return { success: false, error: 'Failed to force synchronization' };
    }
  }
}

// Export singleton instance
export const auctionStatusMonitor = AuctionStatusMonitor.getInstance();
