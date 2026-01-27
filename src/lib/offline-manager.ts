class OfflineManager {
  private _isOnline = true;
  private _circuitBreakerOpen = false;
  private _lastSuccessfulRequest = Date.now();
  private _consecutiveFailures = 0;

  private listeners = new Set<(online: boolean) => void>();
  private networkCheckInterval: number | null = null;
  private circuitBreakerInterval: number | null = null;

  // Configuration
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60_000;
  private readonly REQUEST_TIMEOUT = 10_000;

  constructor() {
    if (typeof window === 'undefined') return;

    this._isOnline = navigator.onLine;

    window.addEventListener('online', () => this.handleOnlineEvent());
    window.addEventListener('offline', () => this.handleOfflineEvent());

    this.networkCheckInterval = window.setInterval(
      () => this.checkNetworkStatus(),
      30_000
    );

    this.circuitBreakerInterval = window.setInterval(
      () => this.checkCircuitBreaker(),
      10_000
    );
  }

  /* ---------------- CORE STATE ---------------- */

  isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return this._isOnline && !this._circuitBreakerOpen;
  }

  isOffline(): boolean {
    if (typeof window === 'undefined') return false;
    return !this.isOnline();
  }

  /**
   * Strong guard: callers should check this before ANY network work
   */
  canMakeApiCall(): boolean {
    return this.isOnline();
  }

  /* ---------------- EVENTS ---------------- */

  private handleOnlineEvent() {
    this.resetFailures();
    this.setOnline(true);
  }

  private handleOfflineEvent() {
    this.setOnline(false);
  }

  private setOnline(online: boolean) {
    if (this._isOnline === online) return;

    this._isOnline = online;
    this.listeners.forEach(fn => {
      try { fn(online); } catch {}
    });
  }

  /* ---------------- CIRCUIT BREAKER ---------------- */

  private recordSuccess() {
    this._consecutiveFailures = 0;
    this._lastSuccessfulRequest = Date.now();
    this._circuitBreakerOpen = false;
  }

  private recordFailure() {
    this._consecutiveFailures++;

    if (this._consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this._circuitBreakerOpen = true;
      console.warn('🚨 Circuit breaker opened');
    }
  }

  private resetFailures() {
    this._consecutiveFailures = 0;
    this._circuitBreakerOpen = false;
    this._lastSuccessfulRequest = Date.now();
  }

  private checkCircuitBreaker() {
    if (!this._circuitBreakerOpen) return;

    const elapsed = Date.now() - this._lastSuccessfulRequest;
    if (elapsed >= this.CIRCUIT_BREAKER_TIMEOUT) {
      console.log('🔄 Closing circuit breaker');
      this.resetFailures();
    }
  }

  /* ---------------- NETWORK CHECK ---------------- */

  private async checkNetworkStatus() {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const res = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });

      if (!res.ok) throw new Error('Health check failed');

      this.recordSuccess();
      this.setOnline(true);
    } catch {
      this.recordFailure();
      this.setOnline(false);
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ---------------- SAFE FETCH ---------------- */

  async safeFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (!this.canMakeApiCall()) {
      throw new Error('Offline or circuit breaker open');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.recordSuccess();
      return res;
    } catch (err) {
      this.recordFailure();
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ---------------- SUBSCRIPTIONS ---------------- */

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /* ---------------- DEBUG ---------------- */

  getConnectionInfo() {
    if (typeof window === 'undefined') {
      return { isOnline: true, navigatorOnline: true };
    }

    return {
      isOnline: this.isOnline(),
      navigatorOnline: navigator.onLine,
      failures: this._consecutiveFailures,
      circuitBreakerOpen: this._circuitBreakerOpen
    };
  }

  destroy() {
    if (this.networkCheckInterval) clearInterval(this.networkCheckInterval);
    if (this.circuitBreakerInterval) clearInterval(this.circuitBreakerInterval);
    this.listeners.clear();
  }
}

export const offlineManager = new OfflineManager();
