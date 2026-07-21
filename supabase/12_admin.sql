-- Create app configurations table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed configuration variables
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('commission_percentage', '15.00', 'Percentage ZipRide takes from each completed trip'),
  ('base_cancellation_fee', '2.00', 'Cancellation fee charged to riders when driver accepted'),
  ('minimum_distance_miles', '0.50', 'Minimum distance required to book a ride')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Analytical view: Revenue reports
CREATE OR REPLACE VIEW public.revenue_reports AS
SELECT
  r.id as ride_id,
  r.rider_id,
  r.driver_id,
  r.fare,
  r.distance,
  r.duration,
  r.payment_method,
  r.completed_at,
  ROUND((r.fare * (SELECT value::numeric FROM public.admin_settings WHERE key = 'commission_percentage') / 100)::numeric, 2) as platform_commission,
  ROUND((r.fare * (100 - (SELECT value::numeric FROM public.admin_settings WHERE key = 'commission_percentage')) / 100)::numeric, 2) as driver_earnings
FROM public.rides r
WHERE r.status = 'completed';
