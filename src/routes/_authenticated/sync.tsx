import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SyncControlPanel } from "@/components/SyncControlPanel";

export const Route = createFileRoute("/_authenticated/sync")({
  head: () => ({ meta: [{ title: "Data Sync" }] }),
  component: SyncPage,
});

function SyncPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("sync.title")}</h2>
      <SyncControlPanel />
    </div>
  );
}
