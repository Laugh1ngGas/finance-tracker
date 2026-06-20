
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO authenticated, anon;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings readable" ON public.system_settings FOR SELECT USING (true);

CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type text NOT NULL CHECK (sync_type IN ('currency','tax')),
  status text NOT NULL CHECK (status IN ('success','failed','running')),
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.sync_logs TO authenticated, anon;
GRANT ALL ON public.sync_logs TO service_role;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs readable" ON public.sync_logs FOR SELECT USING (true);

CREATE INDEX sync_logs_type_started_idx ON public.sync_logs(sync_type, started_at DESC);

INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('currency_update_interval', '43200'),
  ('tax_update_interval', '86400')
ON CONFLICT (setting_key) DO NOTHING;
