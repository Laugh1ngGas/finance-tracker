import * as XLSX from "xlsx";
import type { ReportData, ExportLabels } from "./pdfExportService";

export function exportReportExcel(report: ReportData, labels: ExportLabels, fileName: string) {
  const wb = XLSX.utils.book_new();

  const summary = [
    [report.title],
    [report.period],
    [`${labels.generatedDate}`, new Date().toLocaleString()],
    [],
    [labels.baseCurrency, report.baseCurrency],
    [labels.income, report.income],
    [labels.expenses, report.expenses],
    [labels.net, report.net],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  const txHeader = [labels.date, labels.type, labels.category, labels.amount, labels.currency, labels.rate, labels.converted];
  const txRows = report.transactions.map((t) => [
    t.date, t.type, t.category, t.original, t.originalCurrency, t.rate, t.converted,
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([txHeader, ...txRows]), "Transactions");

  const taxSheet = [
    [labels.country, labels.rate, labels.taxAmount],
    [report.taxCountry, `${report.taxRate}%`, report.taxAmount],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taxSheet), "Tax");

  const analytics = [
    [labels.category, labels.amount],
    ...report.categories.map((c) => [c.name, c.amount]),
    [],
    [labels.total, report.categories.reduce((s, c) => s + c.amount, 0)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(analytics), "Analytics");

  XLSX.writeFile(wb, fileName);
}
