import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/use-finance-data";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_CURRENCIES } from "@/services/currencyService";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile" }] }),
  component: ProfilePage,
});

const COUNTRIES: { code: string; name: string }[] = [
  { code: "UA", name: "Ukraine" },
  { code: "PL", name: "Poland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "OTHER", name: "Other" },
];

function ProfilePage() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<string>("UAH");
  const [country, setCountry] = useState<string>("UA");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setEmail(profile.email ?? "");
      setCurrency(profile.currency ?? "UAH");
      setCountry(((profile as any).country ?? "UA"));
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const countryName = COUNTRIES.find(c => c.code === country)?.name ?? "Other";
      const { error } = await supabase.from("profiles").update({
        full_name: name,
        currency,
        country,
        country_name: countryName,
      } as any).eq("id", u.user!.id);
      if (error) throw error;
      if (email && email !== u.user!.email) {
        const { error: e2 } = await supabase.auth.updateUser({ email });
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(t("profile.updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-semibold">{t("profile.title")}</h2>

      <Card>
        <CardHeader><CardTitle>{t("profile.account")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>{t("common.name")}</Label><Input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><Label>{t("common.email")}</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div>
            <Label>{t("profile.taxCountry")}</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("profile.preferredCurrency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t("profile.currencyHint")}</p>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{t("common.save")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("common.appearance")}</CardTitle></CardHeader>
        <CardContent>
          <ThemeSwitcher variant="radio" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("common.language")}</CardTitle></CardHeader>
        <CardContent>
          <LanguageSwitcher variant="select" />
        </CardContent>
      </Card>
    </div>
  );
}
