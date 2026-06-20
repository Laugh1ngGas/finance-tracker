import { supabase } from "@/integrations/supabase/client";
import { syncCurrency } from "@/lib/data-refresh.functions";

/** Default refresh window for currency rates (12h, in ms). */
export const CURRENCY_UPDATE_INTERVAL = 12 * 60 * 60 * 1000;

export interface SyncStatus {
  lastSync: string | null;
  isStale: boolean;
  lastStatus: "success" | "failed" | "running" | null;
  lastMessage: string | null;
}

export const CurrencySyncService = {
  async getStatus(intervalMs: number = CURRENCY_UPDATE_INTERVAL): Promise<SyncStatus> {
    const { data: setting } = await supabase
      .from("system_settings" as any)
      .select("setting_value,updated_at")
      .eq("setting_key", "currency_last_sync")
      .maybeSingle();
    const { data: log } = await supabase
      .from("sync_logs" as any)
      .select("status,message,started_at")
      .eq("sync_type", "currency")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastSync = (setting as any)?.setting_value ?? null;
    const isStale = !lastSync || Date.now() - new Date(lastSync).getTime() > intervalMs;
    return {
      lastSync,
      isStale,
      lastStatus: ((log as any)?.status as any) ?? null,
      lastMessage: (log as any)?.message ?? null,
    };
  },

  /** Force a refresh now (calls server fn that fetches provider + writes rates). */
  async sync() {
    return await syncCurrency();
  },

  /** Refresh only if data is stale. Returns true if a sync ran. */
  async syncIfStale(intervalMs: number = CURRENCY_UPDATE_INTERVAL): Promise<boolean> {
    const s = await this.getStatus(intervalMs);
    if (!s.isStale) return false;
    await this.sync();
    return true;
  },
};
