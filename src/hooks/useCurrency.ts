import { useQuery } from "@tanstack/react-query";
import { loadCachedRates, convertWithRates, type ExchangeRateRow } from "@/services/currencyService";

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange_rates"],
    queryFn: loadCachedRates,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCurrencyConverter(baseCurrency: string) {
  const { data: rates = [] } = useExchangeRates();
  const lastUpdate = rates.length
    ? rates.reduce((m: string, r: ExchangeRateRow) => (r.updated_at > m ? r.updated_at : m), rates[0].updated_at)
    : null;
  const isStale = lastUpdate
    ? Date.now() - new Date(lastUpdate).getTime() > 24 * 60 * 60 * 1000
    : true;

  return {
    rates,
    lastUpdate,
    isStale,
    convert: (amount: number, from: string) => convertWithRates(amount, from, baseCurrency, rates),
  };
}
