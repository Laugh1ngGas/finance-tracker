import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SyncStatus } from "@/services/CurrencySyncService";

interface Props {
  title: string;
  status: SyncStatus | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  refreshingLabel: string;
}

export function SyncStatusCard({ title, status, isLoading, isRefreshing, onRefresh, refreshingLabel }: Props) {
  const { t } = useTranslation();
  const last = status?.lastSync ? new Date(status.lastSync).toLocaleString() : t("sync.never");
  const ok = status?.lastStatus === "success";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-yellow-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <div><span className="text-muted-foreground">{t("sync.lastUpdate")}:</span> {isLoading ? "…" : last}</div>
          <div>
            <span className="text-muted-foreground">{t("sync.status")}:</span>{" "}
            {status?.lastStatus ?? "unknown"}
            {status?.isStale && <span className="ml-2 text-yellow-700">({t("sync.stale")})</span>}
          </div>
          {status?.lastMessage && (
            <div className="text-xs text-muted-foreground mt-1">{status.lastMessage}</div>
          )}
        </div>
        {isRefreshing && (
          <div className="text-sm text-primary flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {refreshingLabel}
          </div>
        )}
        <Button size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {isRefreshing ? t("sync.refreshing") : t("sync.refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
