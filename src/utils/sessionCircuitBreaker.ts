/**
 * Circuit breaker implementation for session refresh operations
 * Prevents cascading failures by limiting refresh attempts
 */

const MAX_REFRESH_ATTEMPTS = 2; // Maximum number of refresh attempts per time window
const REFRESH_TIMEOUT_MS = 10000; // 10 second timeout for refresh operations
const BACKOFF_TIME_MS = 2000; // Base backoff time between refresh attempts
const CIRCUIT_RESET_MS = 30000; // Time until circuit resets after tripping (30 seconds)

type CircuitBreakerState = 'closed' | 'open' | 'half-open';

interface RefreshStats {
  lastAttemptTime: number;
  attemptCount: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
}

// Update the return type to include remainingMs
interface CanRefreshResult {
  allowed: boolean;
  reason?: string;
  remainingMs?: number; // Added this property to the interface
}

class SessionCircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private stats: RefreshStats = {
    lastAttemptTime: 0,
    attemptCount: 0,
    consecutiveFailures: 0,
  };
  private circuitOpenTime: number = 0;
  private refreshInProgress: boolean = false;
  private refreshPromise: Promise<any> | null = null;

  /**
   * Check if a refresh operation is allowed based on circuit breaker state
   */
  canRefresh(): CanRefreshResult {
    const now = Date.now();
    
    // Check if refresh is in progress
    if (this.refreshInProgress) {
      return { 
        allowed: false,
        reason: 'refresh_in_progress' 
      };
    }

    // Check circuit state
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (now - this.circuitOpenTime >= CIRCUIT_RESET_MS) {
        this.state = 'half-open';
        console.log('Circuit breaker transitioning to half-open state');
      } else {
        return { 
          allowed: false, 
          reason: 'circuit_open',
          // Include remaining time until reset
          remainingMs: CIRCUIT_RESET_MS - (now - this.circuitOpenTime)
        };
      }
    }

    // Check attempt rate
    if (now - this.stats.lastAttemptTime < BACKOFF_TIME_MS * (this.stats.attemptCount || 1)) {
      return { 
        allowed: false, 
        reason: 'too_frequent' 
      };
    }

    // Check max attempts
    if (this.stats.attemptCount >= MAX_REFRESH_ATTEMPTS) {
      // Trip the circuit
      this.tripCircuit('max_attempts_reached');
      return { 
        allowed: false, 
        reason: 'max_attempts_reached' 
      };
    }

    return { allowed: true };
  }

  /**
   * Execute a refresh operation with circuit breaker protection
   */
  async executeRefresh<T>(refreshFn: () => Promise<T>): Promise<T> {
    const canRefreshResult = this.canRefresh();
    
    if (!canRefreshResult.allowed) {
      console.warn(`Refresh blocked: ${canRefreshResult.reason}`);
      return Promise.reject(new Error(`Session refresh blocked: ${canRefreshResult.reason}`));
    }

    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise as Promise<T>;
    }

    this.refreshInProgress = true;
    this.stats.lastAttemptTime = Date.now();
    this.stats.attemptCount++;

    // Create a promise with timeout
    this.refreshPromise = Promise.race([
      refreshFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), REFRESH_TIMEOUT_MS);
      })
    ]);

    try {
      const result = await this.refreshPromise;
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure(error);
      throw error;
    } finally {
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Handle successful refresh
   */
  private handleSuccess(): void {
    this.stats.consecutiveFailures = 0;
    
    // If we were in half-open state, close the circuit
    if (this.state === 'half-open') {
      this.state = 'closed';
      console.log('Circuit breaker closed after successful operation');
    }
    
    // Reset attempt count after a successful operation when in closed state
    if (this.state === 'closed') {
      setTimeout(() => {
        this.stats.attemptCount = 0;
      }, CIRCUIT_RESET_MS);
    }
  }

  /**
   * Handle failed refresh
   */
  private handleFailure(error: any): void {
    this.stats.consecutiveFailures++;
    this.stats.lastErrorMessage = error?.message || 'Unknown error';
    
    // If we hit threshold, trip circuit
    if (this.stats.consecutiveFailures >= 2) {
      this.tripCircuit('consecutive_failures');
    }
  }

  /**
   * Trip the circuit breaker
   */
  private tripCircuit(reason: string): void {
    if (this.state !== 'open') {
      this.state = 'open';
      this.circuitOpenTime = Date.now();
      console.warn(`Circuit breaker tripped: ${reason}`);
    }
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.stats = {
      lastAttemptTime: 0,
      attemptCount: 0,
      consecutiveFailures: 0
    };
    this.refreshInProgress = false;
    this.refreshPromise = null;
    console.log('Circuit breaker has been manually reset');
  }

  /**
   * Get current circuit breaker state
   */
  getStatus(): { 
    state: CircuitBreakerState; 
    stats: RefreshStats; 
    canRefresh: boolean;
  } {
    return {
      state: this.state,
      stats: { ...this.stats },
      canRefresh: this.canRefresh().allowed
    };
  }
}

// Export singleton instance
export const sessionCircuitBreaker = new SessionCircuitBreaker();

// Helper function to determine if error qualifies for retry
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Check error message strings
  const errorMsg = typeof error === 'string' 
    ? error.toLowerCase() 
    : error?.message?.toLowerCase?.() || '';

  // Network or temporary errors
  const retryablePatterns = [
    'network error',
    'timeout',
    'connection',
    'offline',
    'rate limit',
    'too many requests',
    '429',
    'temporary',
    'token expired',
    'refresh token',
    'auth/token-expired'
  ];

  return retryablePatterns.some(pattern => errorMsg.includes(pattern));
}
