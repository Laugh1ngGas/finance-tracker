import { supabase } from "@/integrations/supabase/client";

export const SUPPORTED_CURRENCIES = ["UAH", "USD", "EUR", "GBP", "PLN", "CAD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface ExchangeRateRow {
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}

export interface ExchangeRateProvider {
  /** Returns rates with base=USD (rate of 1 USD in target). */
  fetchUsdRates(): Promise<Record<string, number>>;
}

/** Default provider: open.er-api.com — free, no API key. */
export const openErApiProvider: ExchangeRateProvider = {
  async fetchUsdRates() {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error(`FX API HTTP ${res.status}`);
    const json: any = await res.json();
    if (json.result !== "success" || !json.rates) throw new Error("FX API bad payload");
    return json.rates as Record<string, number>;
  },
};

/** Fetch all cached rates from the database. */
export async function loadCachedRates(): Promise<ExchangeRateRow[]> {
  const { data, error } = await supabase.from("exchange_rates" as any).select("*");
  if (error) throw error;
  return (data ?? []) as any;
}

/** Convert amount from one currency to another using USD as pivot. */
export function convertWithRates(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRateRow[],
): { converted: number; rate: number } {
  if (from === to) return { converted: amount, rate: 1 };
  const map = new Map(rates.filter(r => r.base_currency === "USD").map(r => [r.target_currency, Number(r.rate)]));
  map.set("USD", 1);
  const fromUsd = map.get(from);
  const toUsd = map.get(to);
  if (!fromUsd || !toUsd) {
    // Fallback: assume 1:1 if rate unknown
    return { converted: amount, rate: 1 };
  }
  // amount in USD = amount / fromUsd; then * toUsd
  const usd = amount / fromUsd;
  const converted = usd * toUsd;
  const rate = toUsd / fromUsd;
  return { converted, rate };
}

export interface ConversionInfo {
  converted: number;
  rate: number;
  isStale: boolean;
  lastUpdate: string | null;
}

export async function convertAmount(amount: number, from: string, to: string): Promise<ConversionInfo> {
  const rates = await loadCachedRates();
  const lastUpdate = rates.length
    ? rates.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), rates[0].updated_at)
    : null;
  const isStale = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() > 24 * 60 * 60 * 1000 : true;
  const { converted, rate } = convertWithRates(amount, from, to, rates);
  return { converted, rate, isStale, lastUpdate };
}
