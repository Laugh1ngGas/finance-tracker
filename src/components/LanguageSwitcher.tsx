import { useLanguage } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES, type Language } from "@/services/languageService";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ variant = "select" }: { variant?: "select" | "compact" }) {
  const { language, setLanguage } = useLanguage();
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Globe className="w-4 h-4 mr-1" /> {current.flag}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SUPPORTED_LANGUAGES.map((l) => (
            <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)}>
              <span className="mr-2">{l.flag}</span> {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            <span className="mr-2">{l.flag}</span>{l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
