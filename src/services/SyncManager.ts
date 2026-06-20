import { CurrencySyncService, CURRENCY_UPDATE_INTERVAL } from "./CurrencySyncService";
import { TaxSyncService, TAX_UPDATE_INTERVAL } from "./TaxSyncService";

/**
 * Coordinates background sync of currency and tax data.
 * - Runs on app startup and after login (via syncIfStale).
 * - Schedules periodic background refresh.
 * - Failures are swallowed (cached data continues to work).
 */
export class SyncManager {
  private timers: number[] = [];
  private started = false;

  /** Run sync-if-stale for both feeds. Safe to call repeatedly. */
  async syncAllIfStale(): Promise<{ currency: boolean; tax: boolean }> {
    const [currency, tax] = await Promise.all([
      CurrencySyncService.syncIfStale().catch(() => false),
      TaxSyncService.syncIfStale().catch(() => false),
    ]);
    return { currency, tax };
  }

  async syncAllNow() {
    const [currency, tax] = await Promise.all([
      CurrencySyncService.sync().catch((e) => ({ ok: false, error: (e as Error).message })),
      TaxSyncService.sync().catch((e) => ({ ok: false, error: (e as Error).message })),
    ]);
    return { currency, tax };
  }

  /** Begin scheduled background updates. Idempotent. */
  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    // Initial check shortly after start.
    void this.syncAllIfStale();
    this.timers.push(
      window.setInterval(() => {
        void CurrencySyncService.syncIfStale().catch(() => {});
      }, CURRENCY_UPDATE_INTERVAL),
      window.setInterval(() => {
        void TaxSyncService.syncIfStale().catch(() => {});
      }, TAX_UPDATE_INTERVAL),
    );
  }

  stop() {
    this.timers.forEach((t) => window.clearInterval(t));
    this.timers = [];
    this.started = false;
  }
}

export const syncManager = new SyncManager();
