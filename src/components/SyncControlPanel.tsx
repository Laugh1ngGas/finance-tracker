import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SyncStatusCard } from "./SyncStatusCard";
import { useCurrencySync, useCurrencySyncStatus } from "@/hooks/useCurrencySync";
import { useTaxSync, useTaxSyncStatus } from "@/hooks/useTaxSync";

export function SyncControlPanel() {
  const { t } = useTranslation();
  const cur = useCurrencySyncStatus();
  const tax = useTaxSyncStatus();
  const curSync = useCurrencySync();
  const taxSync = useTaxSync();

  const refreshing = curSync.isPending || taxSync.isPending;

  const refreshAll = () => {
    curSync.mutate();
    taxSync.mutate();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("sync.title")}</CardTitle>
          <Button size="sm" variant="default" onClick={refreshAll} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {t("sync.refreshAll")}
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("sync.description")}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SyncStatusCard
          title={t("sync.currencyData")}
          status={cur.data}
          isLoading={cur.isLoading}
          isRefreshing={curSync.isPending}
          onRefresh={() => curSync.mutate()}
          refreshingLabel={t("sync.updatingCurrency")}
        />
        <SyncStatusCard
          title={t("sync.taxData")}
          status={tax.data}
          isLoading={tax.isLoading}
          isRefreshing={taxSync.isPending}
          onRefresh={() => taxSync.mutate()}
          refreshingLabel={t("sync.updatingTax")}
        />
      </div>
    </div>
  );
}
