
-- profiles: country_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_name text;

-- exchange_rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);
GRANT SELECT ON public.exchange_rates TO authenticated, anon;
GRANT ALL ON public.exchange_rates TO service_role;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates readable" ON public.exchange_rates FOR SELECT USING (true);

-- tax_rates table
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  tax_type text NOT NULL DEFAULT 'personal_income',
  rate numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, tax_type)
);
GRANT SELECT ON public.tax_rates TO authenticated, anon;
GRANT ALL ON public.tax_rates TO service_role;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_rates readable" ON public.tax_rates FOR SELECT USING (true);

-- Seed tax_rates (effective personal income / small-business indicative rates)
INSERT INTO public.tax_rates (country_code, country_name, tax_type, rate) VALUES
  ('UA','Ukraine','personal_income',5),
  ('PL','Poland','personal_income',12),
  ('DE','Germany','personal_income',25),
  ('FR','France','personal_income',20),
  ('IT','Italy','personal_income',23),
  ('ES','Spain','personal_income',19),
  ('GB','United Kingdom','personal_income',20),
  ('US','United States','personal_income',22),
  ('CA','Canada','personal_income',20),
  ('OTHER','Other','personal_income',15)
ON CONFLICT (country_code, tax_type) DO NOTHING;

-- transactions extension
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS original_amount numeric,
  ADD COLUMN IF NOT EXISTS original_currency text,
  ADD COLUMN IF NOT EXISTS converted_amount numeric,
  ADD COLUMN IF NOT EXISTS converted_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate_used numeric;

-- Backfill: treat existing amount as already in profile currency, rate=1
UPDATE public.transactions t
SET original_amount = t.amount,
    original_currency = COALESCE(p.currency,'UAH'),
    converted_amount = t.amount,
    converted_currency = COALESCE(p.currency,'UAH'),
    exchange_rate_used = 1
FROM public.profiles p
WHERE t.user_id = p.id AND t.original_amount IS NULL;
