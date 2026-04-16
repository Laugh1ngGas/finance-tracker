type CountryTax = {
  rate: number;
  esv?: number;
};

const taxRules: Record<string, CountryTax> = {
  Ukraine: { rate: 0.05, esv: 1474 },
  Poland: { rate: 0.12 },
  Germany: { rate: 0.25 },
  USA: { rate: 0.22 },
};

export const calculateTax = (
  income: number,
  country: string
) => {
  const rule = taxRules[country] || { rate: 0.2 };

  const tax = income * rule.rate;
  const esv = rule.esv || 0;

  return {
    tax,
    esv,
    total: tax + esv,
  };
};