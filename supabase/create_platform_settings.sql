-- Run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow public access
DROP POLICY IF EXISTS "Allow public select platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public select platform_settings" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public insert platform_settings" ON public.platform_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public update platform_settings" ON public.platform_settings FOR UPDATE USING (true);

-- Insert default configs
INSERT INTO public.platform_settings (key, value) VALUES 
  ('base_fare', '40'),
  ('per_km_rate', '12'),
  ('commission', '20'),
  ('cancellation_fee', '25'),
  ('surge_pricing', 'true'),
  ('auto_approve', 'false'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
