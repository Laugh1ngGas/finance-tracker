import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { exportReportPdf, type ReportData, type ExportLabels } from "@/services/pdfExportService";
import { exportReportExcel } from "@/services/excelExportService";

interface Props {
  getReport: () => ReportData;
  fileBaseName: string; // e.g. "monthly-report-2026-06"
}

export function ExportButtons({ getReport, fileBaseName }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);

  const labels: ExportLabels = {
    generatedDate: t("reports.generatedDate"),
    baseCurrency: t("reports.baseCurrency"),
    income: t("common.income"),
    expenses: t("common.expenses"),
    net: t("common.net"),
    country: t("common.country"),
    rate: t("common.rate"),
    taxAmount: t("taxes.taxAmount"),
    expensesByCategory: t("reports.expensesByCategory"),
    transactionsWithCurrency: t("reports.transactionsWithCurrency"),
    date: t("common.date"),
    type: t("common.type"),
    category: t("common.category"),
    amount: t("common.amount"),
    currency: t("common.currency"),
    converted: `${t("common.amount")} (${getReport().baseCurrency})`,
    total: t("common.total"),
  };

  async function run(kind: "pdf" | "xlsx") {
    setBusy(kind);
    const toastId = toast.loading(t("common.generating"));
    try {
      const data = getReport();
      const file = `${fileBaseName}.${kind}`;
      if (kind === "pdf") await exportReportPdf(data, labels, file);
      else exportReportExcel(data, labels, file);
      toast.success(t("common.generated"), { id: toastId });
    } catch (e) {
      console.error("Export failed:", e);
      toast.error(t("common.exportFailed"), { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={() => run("pdf")} disabled={busy !== null} variant="default">
        {busy === "pdf" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        {t("common.exportPdf")}
      </Button>
      <Button onClick={() => run("xlsx")} disabled={busy !== null} variant="outline">
        {busy === "xlsx" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
        {t("common.exportExcel")}
      </Button>
    </div>
  );
}
