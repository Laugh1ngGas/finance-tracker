import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, useProfile } from "@/hooks/use-finance-data";
import { useCurrencyConverter } from "@/hooks/useCurrency";
import { monthKey, type Currency } from "@/lib/finance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#3b82f6","#16a34a","#f59e0b","#dc2626","#8b5cf6","#0ea5e9","#ec4899","#10b981","#f97316"];

function AnalyticsPage() {
  const { data: txs = [] } = useTransactions();
  const { data: profile } = useProfile();
  const { t } = useTranslation();
  const baseCurrency = (profile?.currency ?? "UAH") as Currency;
  const { convert } = useCurrencyConverter(baseCurrency);

  const conv = (txs as any[]).map(tx => ({
    ...tx,
    _amt: convert(Number(tx.original_amount ?? tx.amount), tx.original_currency ?? baseCurrency).converted,
  }));

  const byMonth = new Map<string, { month: string; income: number; expense: number }>();
  conv.forEach(tx => {
    const k = monthKey(tx.date);
    const r = byMonth.get(k) ?? { month: k, income: 0, expense: 0 };
    if (tx.type === "income") r.income += tx._amt; else r.expense += tx._amt;
    byMonth.set(k, r);
  });
  const chart = Array.from(byMonth.values()).sort((a,b)=>a.month.localeCompare(b.month));

  const byCat = new Map<string, number>();
  conv.filter(tx => tx.type === "expense").forEach(tx => {
    const name = tx.categories?.name ?? "Other";
    byCat.set(name, (byCat.get(name) ?? 0) + tx._amt);
  });
  const pie = Array.from(byCat.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("analytics.title")} <span className="text-sm font-normal text-muted-foreground">({t("transactions.inCurrency", { currency: baseCurrency })})</span></h2>

      <Card>
        <CardHeader><CardTitle>{t("analytics.monthlyIncome")}</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Bar dataKey="income" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("analytics.monthlyExpenses")}</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Bar dataKey="expense" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("analytics.expensesByCategory")}</CardTitle></CardHeader>
        <CardContent className="h-72">
          {pie.length === 0 ? (
            <div className="text-center text-muted-foreground pt-10">{t("analytics.noExpenseData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
