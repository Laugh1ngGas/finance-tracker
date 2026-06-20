import { createServerFn } from "@tanstack/react-start";
import { openErApiProvider, SUPPORTED_CURRENCIES } from "@/services/currencyService";
import { curatedTaxProvider } from "@/services/taxService";

type SyncType = "currency" | "tax";

async function insertLog(admin: any, sync_type: SyncType, status: string, message: string | null, started_at: string, completed: boolean) {
  await admin.from("sync_logs").insert({
    sync_type,
    status,
    message,
    started_at,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

async function setSetting(admin: any, key: string, value: string) {
  await admin.from("system_settings").upsert(
    { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
    { onConflict: "setting_key" },
  );
}

/** Refresh FX rates: fetches from provider, upserts rates, writes sync_log + system_settings. */
export const syncCurrency = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const startedAt = new Date().toISOString();
  await insertLog(supabaseAdmin, "currency", "running", "Fetching FX rates", startedAt, false);
  try {
    const rates = await openErApiProvider.fetchUsdRates();
    const rows = SUPPORTED_CURRENCIES.map((c) => ({
      base_currency: "USD",
      target_currency: c,
      rate: c === "USD" ? 1 : Number(rates[c] ?? 0),
      updated_at: new Date().toISOString(),
    })).filter((r) => r.rate > 0);
    const { error } = await supabaseAdmin
      .from("exchange_rates" as any)
      .upsert(rows, { onConflict: "base_currency,target_currency" });
    if (error) throw error;
    await setSetting(supabaseAdmin, "currency_last_sync", new Date().toISOString());
    await insertLog(supabaseAdmin, "currency", "success", `Updated ${rows.length} rates`, startedAt, true);
    return { ok: true, updated: rows.length };
  } catch (e) {
    const msg = (e as Error).message;
    await insertLog(supabaseAdmin, "currency", "failed", msg, startedAt, true);
    return { ok: false, error: msg, updated: 0 };
  }
});

/** Refresh tax rates: fetches from provider, upserts rows, writes sync_log + system_settings. */
export const syncTax = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const startedAt = new Date().toISOString();
  await insertLog(supabaseAdmin, "tax", "running", "Fetching tax rates", startedAt, false);
  try {
    const rates = await curatedTaxProvider.fetchRates();
    const rows = rates.map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await supabaseAdmin
      .from("tax_rates" as any)
      .upsert(rows, { onConflict: "country_code,tax_type" });
    if (error) throw error;
    await setSetting(supabaseAdmin, "tax_last_sync", new Date().toISOString());
    await insertLog(supabaseAdmin, "tax", "success", `Updated ${rows.length} countries`, startedAt, true);
    return { ok: true, updated: rows.length };
  } catch (e) {
    const msg = (e as Error).message;
    await insertLog(supabaseAdmin, "tax", "failed", msg, startedAt, true);
    return { ok: false, error: msg, updated: 0 };
  }
});

/** Back-compat aliases used by existing pages. */
export const refreshExchangeRates = syncCurrency;
export const refreshTaxRates = syncTax;
