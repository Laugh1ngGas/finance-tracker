import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { formatMoney, type Currency } from "@/lib/finance";

export interface ReportData {
  title: string;
  period: string;
  baseCurrency: Currency;
  income: number;
  expenses: number;
  net: number;
  taxCountry: string;
  taxRate: number;
  taxAmount: number;
  categories: { name: string; amount: number }[];
  transactions: {
    date: string;
    type: string;
    category: string;
    original: number;
    originalCurrency: string;
    rate: number;
    converted: number;
  }[];
  chartElementIds?: string[];
}

export interface ExportLabels {
  generatedDate: string;
  baseCurrency: string;
  income: string;
  expenses: string;
  net: string;
  country: string;
  rate: string;
  taxAmount: string;
  expensesByCategory: string;
  transactionsWithCurrency: string;
  date: string;
  type: string;
  category: string;
  amount: string;
  currency: string;
  converted: string;
  total: string;
}

export async function exportReportPdf(report: ReportData, labels: ExportLabels, fileName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 40;

  doc.setFontSize(18);
  doc.text(report.title, 40, y); y += 24;
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${report.period}`, 40, y); y += 14;
  doc.text(`${labels.generatedDate}: ${new Date().toLocaleString()}`, 40, y); y += 20;
  doc.setTextColor(0);

  // Summary
  autoTable(doc, {
    startY: y,
    head: [[labels.income, labels.expenses, labels.net, labels.baseCurrency]],
    body: [[
      formatMoney(report.income, report.baseCurrency),
      formatMoney(report.expenses, report.baseCurrency),
      formatMoney(report.net, report.baseCurrency),
      report.baseCurrency,
    ]],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Tax
  autoTable(doc, {
    startY: y,
    head: [[labels.country, labels.rate, labels.taxAmount]],
    body: [[report.taxCountry, `${report.taxRate}%`, formatMoney(report.taxAmount, report.baseCurrency)]],
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Categories
  doc.setFontSize(13);
  doc.text(labels.expensesByCategory, 40, y); y += 6;
  autoTable(doc, {
    startY: y + 4,
    head: [[labels.category, labels.amount]],
    body: report.categories.length
      ? report.categories.map((c) => [c.name, formatMoney(c.amount, report.baseCurrency)])
      : [["—", "—"]],
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Transactions
  doc.setFontSize(13);
  doc.text(labels.transactionsWithCurrency, 40, y); y += 6;
  autoTable(doc, {
    startY: y + 4,
    head: [[labels.date, labels.type, labels.category, labels.amount, labels.currency, labels.rate, labels.converted]],
    body: report.transactions.length
      ? report.transactions.map((t) => [
          t.date, t.type, t.category,
          t.original.toFixed(2), t.originalCurrency, t.rate.toFixed(4),
          formatMoney(t.converted, report.baseCurrency),
        ])
      : [["—", "—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Charts
  if (report.chartElementIds?.length) {
    for (const id of report.chartElementIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      try {
        const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
        const img = canvas.toDataURL("image/png");
        const imgW = pageW - 80;
        const imgH = (canvas.height / canvas.width) * imgW;
        if (y + imgH > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 40; }
        doc.addImage(img, "PNG", 40, y, imgW, imgH);
        y += imgH + 16;
      } catch (e) {
        console.warn("chart capture failed", e);
      }
    }
  }

  doc.save(fileName);
}
