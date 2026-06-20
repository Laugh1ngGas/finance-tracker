import { supabase } from "@/integrations/supabase/client";
import { syncTax } from "@/lib/data-refresh.functions";
import type { SyncStatus } from "./CurrencySyncService";

/** Default refresh window for tax rates (24h, in ms). */
export const TAX_UPDATE_INTERVAL = 24 * 60 * 60 * 1000;

export const TaxSyncService = {
  async getStatus(intervalMs: number = TAX_UPDATE_INTERVAL): Promise<SyncStatus> {
    const { data: setting } = await supabase
      .from("system_settings" as any)
      .select("setting_value,updated_at")
      .eq("setting_key", "tax_last_sync")
      .maybeSingle();
    const { data: log } = await supabase
      .from("sync_logs" as any)
      .select("status,message,started_at")
      .eq("sync_type", "tax")
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

  async sync() {
    return await syncTax();
  },

  async syncIfStale(intervalMs: number = TAX_UPDATE_INTERVAL): Promise<boolean> {
    const s = await this.getStatus(intervalMs);
    if (!s.isStale) return false;
    await this.sync();
    return true;
  },
};
