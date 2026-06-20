import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions, useProfile } from "@/hooks/use-finance-data";
import { useCurrencyConverter } from "@/hooks/useCurrency";
import { useTaxRates } from "@/hooks/useTax";
import { TaxCalculationService } from "@/services/taxService";
import { formatMoney, monthKey, type Currency } from "@/lib/finance";
import { useServerFn } from "@tanstack/react-start";
import { refreshTaxRates, refreshExchangeRates } from "@/lib/data-refresh.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/taxes")({
  head: () => ({ meta: [{ title: "Taxes" }] }),
  component: TaxesPage,
});

function TaxesPage() {
  const { data: txs = [] } = useTransactions();
  const { data: profile } = useProfile();
  const { data: rates = [] } = useTaxRates();
  const { t } = useTranslation();
  const baseCurrency = (profile?.currency ?? "UAH") as Currency;
  const country = ((profile as any)?.country ?? "UA") as string;
  const { convert, isStale, lastUpdate } = useCurrencyConverter(baseCurrency);
  const svc = new TaxCalculationService(rates);
  const rateRow = svc.getRateForCountry(country);
  const qc = useQueryClient();

  const refreshTax = useServerFn(refreshTaxRates);
  const refreshFx = useServerFn(refreshExchangeRates);

  const refresh = useMutation({
    mutationFn: async () => {
      await refreshFx();
      await refreshTax();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_rates"] });
      qc.invalidateQueries({ queryKey: ["exchange_rates"] });
      toast.success(t("taxes.ratesRefreshed"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byMonth = new Map<string, number>();
  (txs as any[]).filter(tx => tx.type === "income").forEach(tx => {
    const k = monthKey(tx.date);
    const amt = convert(Number(tx.original_amount ?? tx.amount), tx.original_currency ?? baseCurrency).converted;
    byMonth.set(k, (byMonth.get(k) ?? 0) + amt);
  });
  const months = Array.from(byMonth.entries()).sort((a,b)=>b[0].localeCompare(a[0])).slice(0, 12);

  const totalIncome = months.reduce((s, [,v]) => s + v, 0);
  const monthlyAvgIncome = months.length ? totalIncome / months.length : 0;
  const annualEstIncome = monthlyAvgIncome * 12;
  const annualTax = svc.calculate(annualEstIncome, country).taxAmount;
  const monthlyTax = svc.calculate(monthlyAvgIncome, country).taxAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-semibold">{t("taxes.title")}</h2>
        <Button onClick={() => refresh.mutate()} disabled={refresh.isPending} variant="outline">
          {refresh.isPending ? t("taxes.refreshing") : t("taxes.refreshRates")}
        </Button>
      </div>

      {isStale && (
        <div className="text-sm rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900">
          {t("dashboard.staleData")}{lastUpdate ? ` (${new Date(lastUpdate).toLocaleString()})` : ""}.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("taxes.currentRate")}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{rateRow?.rate ?? "—"}%</div>
            <div className="text-xs text-muted-foreground">{rateRow?.country_name ?? country}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("taxes.estMonthly")}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(monthlyTax, baseCurrency)}</div>
            <div className="text-xs text-muted-foreground">{t("taxes.onAvg", { amount: formatMoney(monthlyAvgIncome, baseCurrency) })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t("taxes.estAnnual")}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{formatMoney(annualTax, baseCurrency)}</div>
            <div className="text-xs text-muted-foreground">{t("taxes.onEstAnnual", { amount: formatMoney(annualEstIncome, baseCurrency) })}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("taxes.summary")}</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row k={t("common.country")} v={rateRow?.country_name ?? country} />
          <Row k={t("taxes.rate")} v={`${rateRow?.rate ?? 0}%`} />
          <Row k={t("taxes.taxableIncome")} v={formatMoney(totalIncome, baseCurrency)} />
          <Row k={t("taxes.estTaxTotal")} v={formatMoney(svc.calculate(totalIncome, country).taxAmount, baseCurrency)} />
          <Row k={t("taxes.lastUpdate")} v={rateRow ? new Date(rateRow.updated_at).toLocaleString() : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("taxes.monthlyOverview")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.month")}</TableHead>
                <TableHead className="text-right">{t("common.income")}</TableHead>
                <TableHead className="text-right">{t("common.rate")}</TableHead>
                <TableHead className="text-right">{t("taxes.taxAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map(([m, income]) => {
                const c = svc.calculate(income, country);
                return (
                  <TableRow key={m}>
                    <TableCell>{m}</TableCell>
                    <TableCell className="text-right">{formatMoney(income, baseCurrency)}</TableCell>
                    <TableCell className="text-right">{c.rate}%</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(c.taxAmount, baseCurrency)}</TableCell>
                  </TableRow>
                );
              })}
              {months.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">{t("taxes.noIncome")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
