import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaxSyncService } from "@/services/TaxSyncService";
import { toast } from "sonner";

export function useTaxSyncStatus() {
  return useQuery({
    queryKey: ["sync_status", "tax"],
    queryFn: () => TaxSyncService.getStatus(),
    refetchInterval: 60_000,
  });
}

export function useTaxSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => TaxSyncService.sync(),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Tax rates updated (${r.updated})`);
      else toast.error(`Tax update failed: ${r?.error ?? "unknown"} — using cached data`);
      qc.invalidateQueries({ queryKey: ["tax_rates"] });
      qc.invalidateQueries({ queryKey: ["sync_status", "tax"] });
    },
    onError: (e: any) => {
      toast.error(`Unable to retrieve latest tax data. Using previously saved information. (${e?.message ?? "network"})`);
    },
  });
}
