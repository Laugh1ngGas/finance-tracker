import { supabase } from "@/integrations/supabase/client";

export interface TaxRateRow {
  id: string;
  country_code: string;
  country_name: string;
  tax_type: string;
  rate: number;
  updated_at: string;
}

export interface TaxProvider {
  /** Fetch tax rates for all supported countries. */
  fetchRates(): Promise<Array<Omit<TaxRateRow, "id" | "updated_at">>>;
}

/** Default provider: curated dataset (swap by injecting a different provider). */
export const curatedTaxProvider: TaxProvider = {
  async fetchRates() {
    return [
      { country_code: "UA", country_name: "Ukraine", tax_type: "personal_income", rate: 5 },
      { country_code: "PL", country_name: "Poland", tax_type: "personal_income", rate: 12 },
      { country_code: "DE", country_name: "Germany", tax_type: "personal_income", rate: 25 },
      { country_code: "FR", country_name: "France", tax_type: "personal_income", rate: 20 },
      { country_code: "IT", country_name: "Italy", tax_type: "personal_income", rate: 23 },
      { country_code: "ES", country_name: "Spain", tax_type: "personal_income", rate: 19 },
      { country_code: "GB", country_name: "United Kingdom", tax_type: "personal_income", rate: 20 },
      { country_code: "US", country_name: "United States", tax_type: "personal_income", rate: 22 },
      { country_code: "CA", country_name: "Canada", tax_type: "personal_income", rate: 20 },
      { country_code: "OTHER", country_name: "Other", tax_type: "personal_income", rate: 15 },
    ];
  },
};

export async function loadTaxRates(): Promise<TaxRateRow[]> {
  const { data, error } = await supabase.from("tax_rates" as any).select("*");
  if (error) throw error;
  return (data ?? []) as any;
}

export interface TaxComputation {
  rate: number;
  taxAmount: number;
  netAmount: number;
  isStale: boolean;
  lastUpdate: string | null;
}

export class TaxCalculationService {
  constructor(private rates: TaxRateRow[]) {}

  static async load(): Promise<TaxCalculationService> {
    return new TaxCalculationService(await loadTaxRates());
  }

  getRateForCountry(countryCode: string): TaxRateRow | null {
    return this.rates.find(r => r.country_code === countryCode && r.tax_type === "personal_income")
      ?? this.rates.find(r => r.country_code === "OTHER" && r.tax_type === "personal_income")
      ?? null;
  }

  calculate(income: number, countryCode: string): TaxComputation {
    const row = this.getRateForCountry(countryCode);
    if (!row) {
      return { rate: 0, taxAmount: 0, netAmount: income, isStale: true, lastUpdate: null };
    }
    const rate = Number(row.rate);
    const taxAmount = income * (rate / 100);
    const isStale = Date.now() - new Date(row.updated_at).getTime() > 24 * 60 * 60 * 1000;
    return { rate, taxAmount, netAmount: income - taxAmount, isStale, lastUpdate: row.updated_at };
  }
}
