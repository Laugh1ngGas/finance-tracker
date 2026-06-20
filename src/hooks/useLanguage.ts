import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage as svcSetLanguage, getLanguage, type Language } from "@/services/languageService";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-finance-data";
import { useQueryClient } from "@tanstack/react-query";

export function useLanguage() {
  const { i18n } = useTranslation();
  // Derive directly from i18n — useTranslation re-renders all consumers on languageChanged,
  // so every <LanguageSwitcher /> stays in sync automatically.
  const language = ((["uk", "en", "pl"] as const).includes(i18n.language as Language)
    ? (i18n.language as Language)
    : getLanguage());
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  useEffect(() => {
    const remote = (profile as any)?.language as Language | undefined;
    if (remote && remote !== i18n.language) {
      svcSetLanguage(remote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(profile as any)?.language]);

  const setLanguage = useCallback(async (lng: Language) => {
    svcSetLanguage(lng);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("profiles").update({ language: lng } as any).eq("id", u.user.id);
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      console.warn("Language profile sync skipped:", e);
    }
  }, [qc]);

  return { language, setLanguage };
}
