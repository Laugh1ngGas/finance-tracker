export type Currency = "UAH" | "USD" | "EUR" | "GBP" | "PLN" | "CAD";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  UAH: "₴", USD: "$", EUR: "€", GBP: "£", PLN: "zł", CAD: "C$",
};

export function formatMoney(amount: number, currency: Currency = "UAH") {
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  return `${sym}${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface TaxSettings {
  system: string;
  group2_fixed_tax: number;
  esv: number;
  group3_rate: number;
}

export function calcMonthlyTax(income: number, s: TaxSettings) {
  if (s.system === "group2") {
    return { tax: Number(s.group2_fixed_tax), esv: Number(s.esv), total: Number(s.group2_fixed_tax) + Number(s.esv) };
  }
  const tax = income * (Number(s.group3_rate) / 100);
  return { tax, esv: Number(s.esv), total: tax + Number(s.esv) };
}

export function monthKey(date: string) {
  return date.slice(0, 7); // YYYY-MM
}
