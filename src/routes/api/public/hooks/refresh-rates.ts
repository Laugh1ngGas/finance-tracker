import { createFileRoute } from "@tanstack/react-router";
import { openErApiProvider, SUPPORTED_CURRENCIES } from "@/services/currencyService";
import { curatedTaxProvider } from "@/services/taxService";

export const Route = createFileRoute("/api/public/hooks/refresh-rates")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result: any = { fx: { ok: false }, tax: { ok: false } };

        try {
          const rates = await openErApiProvider.fetchUsdRates();
          const rows = SUPPORTED_CURRENCIES.map(c => ({
            base_currency: "USD",
            target_currency: c,
            rate: c === "USD" ? 1 : Number(rates[c] ?? 0),
            updated_at: new Date().toISOString(),
          })).filter(r => r.rate > 0);
          const { error } = await supabaseAdmin
            .from("exchange_rates" as any)
            .upsert(rows, { onConflict: "base_currency,target_currency" });
          if (error) throw error;
          result.fx = { ok: true, updated: rows.length };
        } catch (e) {
          result.fx = { ok: false, error: (e as Error).message };
        }

        try {
          const tax = await curatedTaxProvider.fetchRates();
          const rows = tax.map(r => ({ ...r, updated_at: new Date().toISOString() }));
          const { error } = await supabaseAdmin
            .from("tax_rates" as any)
            .upsert(rows, { onConflict: "country_code,tax_type" });
          if (error) throw error;
          result.tax = { ok: true, updated: rows.length };
        } catch (e) {
          result.tax = { ok: false, error: (e as Error).message };
        }

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
