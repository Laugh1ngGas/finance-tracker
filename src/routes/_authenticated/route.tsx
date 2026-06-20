import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { syncManager } from "@/services/SyncManager";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  // Mount hooks so theme/language sync with profile across devices
  useTheme();
  useLanguage();

  const NAV = [
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/transactions", label: t("nav.transactions") },
    { to: "/analytics", label: t("nav.analytics") },
    { to: "/taxes", label: t("nav.taxes") },
    { to: "/reports", label: t("nav.reports") },
    { to: "/sync", label: t("nav.sync") },
    { to: "/profile", label: t("nav.profile") },
  ] as const;

  useEffect(() => {
    syncManager.start();
    void syncManager.syncAllIfStale();
    return () => syncManager.stop();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <h1 className="text-lg font-semibold text-primary">{t("app.name")}</h1>
            <nav className="flex gap-1 flex-wrap">
              {NAV.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`px-3 py-1.5 rounded-md text-sm ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageSwitcher variant="compact" />
            <ThemeSwitcher variant="compact" />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
