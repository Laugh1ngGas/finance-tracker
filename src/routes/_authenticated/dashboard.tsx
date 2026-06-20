import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useProfile } from "@/hooks/use-finance-data";
import { useCurrencyConverter } from "@/hooks/useCurrency";
import { useTaxService } from "@/hooks/useTax";
import { formatMoney, monthKey, type Currency } from "@/lib/finance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: txs = [] } = useTransactions();
  const { data: profile } = useProfile();
  const { t } = useTranslation();
  const baseCurrency = (profile?.currency ?? "UAH") as Currency;
  const country = ((profile as any)?.country ?? "UA") as string;
  const { convert, isStale, lastUpdate } = useCurrencyConverter(baseCurrency);
  const taxSvc = useTaxService();

  const convertedTx = (txs as any[]).map(tx => {
    const amt = Number(tx.original_amount ?? tx.amount);
    const cur = tx.original_currency ?? baseCurrency;
    return { ...tx, _converted: convert(amt, cur).converted };
  });

  const income = convertedTx.filter(tx => tx.type === "income").reduce((s, tx) => s + tx._converted, 0);
  const expense = convertedTx.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx._converted, 0);
  const balance = income - expense;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthIncome = convertedTx.filter(tx => tx.type === "income" && monthKey(tx.date) === thisMonth)
    .reduce((s, tx) => s + tx._converted, 0);
  const taxCalc = taxSvc.calculate(monthIncome, country);

  const byMonth = new Map<string, { month: string; income: number; expense: number }>();
  convertedTx.forEach(tx => {
    const k = monthKey(tx.date);
    const row = byMonth.get(k) ?? { month: k, income: 0, expense: 0 };
    if (tx.type === "income") row.income += tx._converted; else row.expense += tx._converted;
    byMonth.set(k, row);
  });
  const chart = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("dashboard.title")}</h2>
      {isStale && (
        <div className="text-sm rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900">
          {t("dashboard.staleData")}{lastUpdate ? ` (${new Date(lastUpdate).toLocaleString()})` : ""}.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title={t("dashboard.currentBalance")} value={formatMoney(balance, baseCurrency)} />
        <Stat title={t("dashboard.totalIncome")} value={formatMoney(income, baseCurrency)} accent="text-green-600" />
        <Stat title={t("dashboard.totalExpenses")} value={formatMoney(expense, baseCurrency)} accent="text-red-600" />
        <Stat title={`${t("dashboard.estTax")} (${country}, ${taxCalc.rate}%)`} value={formatMoney(taxCalc.taxAmount, baseCurrency)} accent="text-primary" />
      </div>

      <Card>
        <CardHeader><CardTitle>{t("dashboard.last6Months", { currency: baseCurrency })}</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#16a34a" name={t("common.income")} />
              <Bar dataKey="expense" fill="#dc2626" name={t("common.expense")} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value, accent }: { title: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><div className={`text-2xl font-semibold ${accent ?? ""}`}>{value}</div></CardContent>
    </Card>
  );
}
