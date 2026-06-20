import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import uk from "@/locales/uk/translation.json";
import en from "@/locales/en/translation.json";
import pl from "@/locales/pl/translation.json";

export type Language = "uk" | "en" | "pl";
export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
];

let initialized = false;
export function initI18n() {
  if (initialized) return i18n;
  initialized = true;
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        uk: { translation: uk },
        en: { translation: en },
        pl: { translation: pl },
      },
      fallbackLng: "uk",
      supportedLngs: ["uk", "en", "pl"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "language",
        caches: ["localStorage"],
      },
    });
  return i18n;
}

export function setLanguage(lng: Language) {
  if (typeof localStorage !== "undefined") localStorage.setItem("language", lng);
  i18n.changeLanguage(lng);
}

export function getLanguage(): Language {
  const v = (typeof localStorage !== "undefined" && (localStorage.getItem("language") as Language)) || (i18n.language as Language) || "uk";
  return (["uk", "en", "pl"].includes(v) ? v : "uk") as Language;
}

export default i18n;
