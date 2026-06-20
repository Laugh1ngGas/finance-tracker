import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useTransactions, useProfile } from "@/hooks/use-finance-data";
import { useCurrencyConverter } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, type Currency } from "@/lib/finance";
import { SUPPORTED_CURRENCIES } from "@/services/currencyService";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions" }] }),
  component: TransactionsPage,
});

interface FormState {
  id?: string;
  amount: string;
  currency: string;
  type: "income" | "expense";
  category_id: string;
  date: string;
  description: string;
}

const blank: FormState = {
  amount: "",
  currency: "UAH",
  type: "expense",
  category_id: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

function TransactionsPage() {
  const { data: txs = [] } = useTransactions();
  const { data: cats = [] } = useCategories();
  const { data: profile } = useProfile();
  const { t } = useTranslation();
  const baseCurrency = (profile?.currency ?? "UAH") as Currency;
  const { convert, isStale, lastUpdate } = useCurrencyConverter(baseCurrency);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...blank, currency: baseCurrency });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const { data: u } = await supabase.auth.getUser();
      const amt = Number(f.amount);
      const { converted, rate } = convert(amt, f.currency);
      const payload: any = {
        user_id: u.user!.id,
        amount: converted,
        type: f.type,
        category_id: f.category_id || null,
        date: f.date,
        description: f.description || null,
        original_amount: amt,
        original_currency: f.currency,
        converted_amount: converted,
        converted_currency: baseCurrency,
        exchange_rate_used: rate,
      };
      if (f.id) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false); setForm({ ...blank, currency: baseCurrency });
      toast.success(t("common.saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); toast.success(t("common.deleted")); },
  });

  const filteredCats = cats.filter(c => c.type === form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t("transactions.title")}</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm({ ...blank, currency: baseCurrency }); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> {t("common.new")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? t("transactions.editTitle") : t("transactions.newTitle")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("common.type")}</Label>
                  <Select value={form.type} onValueChange={(v: "income"|"expense") => setForm({ ...form, type: v, category_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t("common.income")}</SelectItem>
                      <SelectItem value="expense">{t("common.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("common.amount")}</Label>
                  <Input type="number" step="0.01" min="0" required value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("common.currency")}</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("common.category")}</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder={t("transactions.selectCategory")} /></SelectTrigger>
                    <SelectContent>
                      {filteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t("common.date")}</Label>
                <Input type="date" required value={form.date} onChange={e=>setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <Label>{t("common.description")}</Label>
                <Input value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
              </div>
              {form.currency !== baseCurrency && form.amount && (
                <div className="text-xs text-muted-foreground">
                  {t("transactions.convertedAt", {
                    amount: formatMoney(convert(Number(form.amount) || 0, form.currency).converted, baseCurrency),
                    rate: convert(1, form.currency).rate.toFixed(4),
                  })}
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isStale && (
        <div className="text-sm rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900">
          {t("transactions.staleRates")}{lastUpdate ? ` (${new Date(lastUpdate).toLocaleString()})` : ""}.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>{t("transactions.all")} ({txs.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>{t("common.category")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead className="text-right">{t("common.original")}</TableHead>
                <TableHead className="text-right">{t("transactions.inCurrency", { currency: baseCurrency })}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.map((tx: any) => {
                const origAmt = Number(tx.original_amount ?? tx.amount);
                const origCur = tx.original_currency ?? baseCurrency;
                const { converted } = convert(origAmt, origCur);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell><span className={tx.type === "income" ? "text-green-600" : "text-red-600"}>{tx.type === "income" ? t("common.income") : t("common.expense")}</span></TableCell>
                    <TableCell>{tx.categories?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{tx.description ?? ""}</TableCell>
                    <TableCell className="text-right">{formatMoney(origAmt, origCur as Currency)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(converted, baseCurrency)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setForm({ id: tx.id, amount: String(origAmt), currency: origCur, type: tx.type, category_id: tx.category_id ?? "", date: tx.date, description: tx.description ?? "" }); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(t("common.confirmDelete"))) del.mutate(tx.id); }}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {txs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("transactions.none")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
