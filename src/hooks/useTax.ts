import { useQuery } from "@tanstack/react-query";
import { loadTaxRates, TaxCalculationService } from "@/services/taxService";

export function useTaxRates() {
  return useQuery({
    queryKey: ["tax_rates"],
    queryFn: loadTaxRates,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTaxService() {
  const { data: rates = [] } = useTaxRates();
  return new TaxCalculationService(rates);
}
