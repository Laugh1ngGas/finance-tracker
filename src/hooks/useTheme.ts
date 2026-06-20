import { useEffect, useState, useCallback } from "react";
import { applyTheme, getStoredTheme, storeTheme, watchSystemTheme, resolveTheme, type Theme } from "@/services/themeService";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-finance-data";
import { useQueryClient } from "@tanstack/react-query";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveTheme(getStoredTheme()));
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  // Apply on mount + watch system changes
  useEffect(() => {
    applyTheme(theme);
    setResolved(resolveTheme(theme));
    const stop = watchSystemTheme(() => theme);
    return stop;
  }, [theme]);

  // Sync from profile (cross-device)
  useEffect(() => {
    const remote = (profile as any)?.theme as Theme | undefined;
    if (remote && remote !== theme) {
      setThemeState(remote);
      storeTheme(remote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(profile as any)?.theme]);

  const setTheme = useCallback(async (t: Theme) => {
    setThemeState(t);
    storeTheme(t);
    setResolved(resolveTheme(t));
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("profiles").update({ theme: t } as any).eq("id", u.user.id);
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      // Column may not exist yet — localStorage still works
      console.warn("Theme profile sync skipped:", e);
    }
  }, [qc]);

  return { theme, resolvedTheme: resolved, setTheme };
}
