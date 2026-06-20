import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurrencySyncService } from "@/services/CurrencySyncService";
import { toast } from "sonner";

export function useCurrencySyncStatus() {
  return useQuery({
    queryKey: ["sync_status", "currency"],
    queryFn: () => CurrencySyncService.getStatus(),
    refetchInterval: 30_000,
  });
}

export function useCurrencySync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => CurrencySyncService.sync(),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Currency rates updated (${r.updated})`);
      else toast.error(`Currency update failed: ${r?.error ?? "unknown"} — using cached data`);
      qc.invalidateQueries({ queryKey: ["exchange_rates"] });
      qc.invalidateQueries({ queryKey: ["sync_status", "currency"] });
    },
    onError: (e: any) => {
      toast.error(`Unable to retrieve latest currency data. Using previously saved information. (${e?.message ?? "network"})`);
    },
  });
}
