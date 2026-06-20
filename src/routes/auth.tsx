import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Personal Finance" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.accountCreated"));
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{t("auth.title")}</CardTitle>
              <CardDescription>{t("auth.subtitle")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <LanguageSwitcher variant="compact" />
              <ThemeSwitcher variant="compact" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 pt-2">
                <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label>{t("auth.password")}</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{t("auth.signIn")}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 pt-2">
                <div><Label>{t("common.name")}</Label><Input required value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label>{t("auth.password")}</Label><Input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{t("auth.createAccount")}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
