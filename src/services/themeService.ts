export type Theme = "light" | "dark" | "system";
const KEY = "theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(t: Theme): "light" | "dark" {
  return t === "system" ? getSystemTheme() : t;
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(t);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function getStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(KEY) as Theme | null;
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function storeTheme(t: Theme) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, t);
  applyTheme(t);
}

let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;
export function watchSystemTheme(getCurrent: () => Theme) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaListener) mq.removeEventListener("change", mediaListener);
  mediaListener = () => {
    if (getCurrent() === "system") applyTheme("system");
  };
  mq.addEventListener("change", mediaListener);
  return () => {
    if (mediaListener) mq.removeEventListener("change", mediaListener);
    mediaListener = null;
  };
}
