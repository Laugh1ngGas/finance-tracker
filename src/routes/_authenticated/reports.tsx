import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTransactions, useProfile } from "@/hooks/use-finance-data";
import { useCurrencyConverter } from "@/hooks/useCurrency";
import { useTaxRates } from "@/hooks/useTax";
import { TaxCalculationService } from "@/services/taxService";
import { formatMoney, type Currency } from "@/lib/finance";
import { ExportButtons } from "@/components/ExportButtons";
import type { ReportData } from "@/services/pdfExportService";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: txs = [] } = useTransactions();
  const { data: profile } = useProfile();
  const { data: taxRates = [] } = useTaxRates();
  const { t } = useTranslation();
  const baseCurrency = (profile?.currency ?? "UAH") as Currency;
  const country = ((profile as any)?.country ?? "UA") as string;
  const { convert } = useCurrencyConverter(baseCurrency);
  const svc = new TaxCalculationService(taxRates);
  const rateRow = svc.getRateForCountry(country);

  const now = new Date();
  const [type, setType] = useState<"month" | "quarter" | "annual">("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

  const filtered = (txs as any[]).filter(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() !== year) return false;
    if (type === "annual") return true;
    if (type === "month") return d.getMonth() + 1 === month;
    const q = Math.floor(d.getMonth() / 3) + 1;
    return q === quarter;
  }).map(tx => {
    const origAmt = Number(tx.original_amount ?? tx.amount);
    const origCur = tx.original_currency ?? baseCurrency;
    const { converted, rate } = convert(origAmt, origCur);
    return { ...tx, _origAmt: origAmt, _origCur: origCur, _converted: converted, _rate: rate };
  });

  const income = filtered.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx._converted,0);
  const expense = filtered.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx._converted,0);
  const taxCalc = svc.calculate(income, country);

  const byCat = new Map<string, number>();
  filtered.filter(tx=>tx.type==="expense").forEach(tx => {
    const n = tx.categories?.name ?? "Other";
    byCat.set(n, (byCat.get(n) ?? 0) + tx._converted);
  });

  const periodLabel =
    type === "month" ? `${year}-${String(month).padStart(2,"0")}` :
    type === "quarter" ? `Q${quarter} ${year}` :
    `${year}`;

  const title =
    type === "month" ? `${t("reports.monthlyReport")} — ${periodLabel}` :
    type === "quarter" ? `${t("reports.quarterlyReport")} — ${periodLabel}` :
    `${t("reports.annualReport")} — ${periodLabel}`;

  const fileBase =
    type === "month" ? `monthly-report-${year}-${String(month).padStart(2,"0")}` :
    type === "quarter" ? `quarterly-report-${year}-Q${quarter}` :
    `annual-report-${year}`;

  function buildReport(): ReportData {
    return {
      title,
      period: periodLabel,
      baseCurrency,
      income,
      expenses: expense,
      net: income - expense,
      taxCountry: rateRow?.country_name ?? country,
      taxRate: rateRow?.rate ?? 0,
      taxAmount: taxCalc.taxAmount,
      categories: Array.from(byCat.entries()).map(([name, amount]) => ({ name, amount })),
      transactions: filtered.map(tx => ({
        date: tx.date,
        type: tx.type,
        category: tx.categories?.name ?? "—",
        original: tx._origAmt,
        originalCurrency: tx._origCur,
        rate: tx._rate,
        converted: tx._converted,
      })),
    };
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("reports.title")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("common.period")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>{t("common.type")}</Label>
              <Select value={type} onValueChange={(v:"month"|"quarter"|"annual")=>setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t("common.monthly")}</SelectItem>
                  <SelectItem value="quarter">{t("common.quarterly")}</SelectItem>
                  <SelectItem value="annual">{t("common.annual")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("common.year")}</Label>
              <Select value={String(year)} onValueChange={(v)=>setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[now.getFullYear()-2, now.getFullYear()-1, now.getFullYear()].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {type === "month" && (
              <div>
                <Label>{t("common.month")}</Label>
                <Select value={String(month)} onValueChange={(v)=>setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({length:12},(_,i)=>i+1).map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {type === "quarter" && (
              <div>
                <Label>{t("common.quarter")}</Label>
                <Select value={String(quarter)} onValueChange={(v)=>setQuarter(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("reports.exportSection")}</CardTitle></CardHeader>
        <CardContent>
          <ExportButtons getReport={buildReport} fileBaseName={fileBase} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Box label={t("common.income")} value={formatMoney(income, baseCurrency)} cls="text-green-600" />
            <Box label={t("common.expenses")} value={formatMoney(expense, baseCurrency)} cls="text-red-600" />
            <Box label={t("common.net")} value={formatMoney(income - expense, baseCurrency)} />
            <Box label={`${t("taxes.taxAmount")} (${rateRow?.rate ?? 0}%)`} value={formatMoney(taxCalc.taxAmount, baseCurrency)} cls="text-primary" />
          </div>

          <div className="text-sm text-muted-foreground">
            {t("common.country")}: <span className="font-medium text-foreground">{rateRow?.country_name ?? country}</span> ·
            {" "}{t("reports.reportingCurrency")}: <span className="font-medium text-foreground">{baseCurrency}</span>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t("reports.expensesByCategory")}</h4>
            <ul className="space-y-1">
              {Array.from(byCat.entries()).map(([n, v]) => (
                <li key={n} className="flex justify-between border-b py-1 text-sm">
                  <span>{n}</span><span>{formatMoney(v, baseCurrency)}</span>
                </li>
              ))}
              {byCat.size === 0 && <li className="text-muted-foreground text-sm">{t("reports.noExpenses")}</li>}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t("reports.transactionsWithCurrency")}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="py-1">{t("common.date")}</th><th>{t("common.type")}</th><th className="text-right">{t("common.amount")}</th><th>{t("common.currency")}</th><th className="text-right">{t("common.rate")}</th><th className="text-right">{baseCurrency}</th></tr>
                </thead>
                <tbody>
                  {filtered.map(tx => (
                    <tr key={tx.id} className="border-t">
                      <td className="py-1">{tx.date}</td>
                      <td className={tx.type === "income" ? "text-green-600" : "text-red-600"}>{tx.type}</td>
                      <td className="text-right">{formatMoney(tx._origAmt, tx._origCur as Currency)}</td>
                      <td>{tx._origCur}</td>
                      <td className="text-right">{tx._rate.toFixed(4)}</td>
                      <td className="text-right font-medium">{formatMoney(tx._converted, baseCurrency)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-4">{t("reports.noTransactions")}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Box({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="border rounded-md p-3 bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${cls ?? ""}`}>{value}</div>
    </div>
  );
}
