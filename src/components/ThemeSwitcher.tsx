import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Theme } from "@/services/themeService";

export function ThemeSwitcher({ variant = "radio" }: { variant?: "radio" | "compact" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label={t("common.theme")}>
            {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="w-4 h-4 mr-2" /> {t("theme.light")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="w-4 h-4 mr-2" /> {t("theme.dark")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="w-4 h-4 mr-2" /> {t("theme.system")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <RadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)} className="grid gap-2">
      {(["light", "dark", "system"] as Theme[]).map((opt) => (
        <div key={opt} className="flex items-center gap-2 rounded-md border p-3">
          <RadioGroupItem value={opt} id={`theme-${opt}`} />
          <Label htmlFor={`theme-${opt}`} className="flex items-center gap-2 cursor-pointer">
            {opt === "light" && <Sun className="w-4 h-4" />}
            {opt === "dark" && <Moon className="w-4 h-4" />}
            {opt === "system" && <Monitor className="w-4 h-4" />}
            {t(`theme.${opt}`)}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
