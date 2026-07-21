-- ==========================================
-- ZIPRIDE COMPLETE DATABASE SCHEMA (COMBINED)
-- Copy and run this entire script in your Supabase SQL Editor
-- Project URL: https://supabase.com/dashboard/project/jqvyigsenkykkkgenwyg
-- ==========================================

-- ==========================================
-- 01. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==========================================
-- 02. PROFILES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'rider',
  phone TEXT,
  firebase_uid TEXT UNIQUE,
  date_of_birth TEXT,
  gender TEXT,
  referral_code TEXT,
  address TEXT,
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 03. DRIVERS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
        CREATE TYPE driver_status AS ENUM ('offline', 'online', 'busy');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  status driver_status NOT NULL DEFAULT 'offline',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  email TEXT,
  license_number TEXT,
  license_expiry TEXT,
  license_image_url TEXT,
  rc_book_url TEXT,
  insurance_url TEXT,
  profile_photo_url TEXT,
  selfie_url TEXT,
  vehicle_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE TRIGGER update_driver_profiles_updated_at
    BEFORE UPDATE ON public.driver_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 04. VEHICLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  license_plate TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 05. LOCATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  coords GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION update_driver_coords_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.coords = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_driver_locations_coords
    BEFORE INSERT OR UPDATE ON public.driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_coords_geography();

-- ==========================================
-- 06. RIDES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
        CREATE TYPE ride_status AS ENUM ('searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status ride_status NOT NULL DEFAULT 'searching',
  pickup_address TEXT NOT NULL,
  pickup_coords GEOGRAPHY(Point, 4326),
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_coords GEOGRAPHY(Point, 4326),
  dropoff_latitude DOUBLE PRECISION NOT NULL,
  dropoff_longitude DOUBLE PRECISION NOT NULL,
  fare NUMERIC(10, 2) NOT NULL,
  distance NUMERIC(6, 2) NOT NULL,
  duration INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION sync_ride_coords_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pickup_coords = ST_SetSRID(ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude), 4326)::geography;
    NEW.dropoff_coords = ST_SetSRID(ST_MakePoint(NEW.dropoff_longitude, NEW.dropoff_latitude), 4326)::geography;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_rides_locations_coords
    BEFORE INSERT OR UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION sync_ride_coords_geography();

-- ==========================================
-- 07. TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ride_tracking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  coords GEOGRAPHY(Point, 4326) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION set_tracking_log_geography()
RETURNS TRIGGER AS $$
BEGIN
    NEW.coords = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_tracking_log_inserted
    BEFORE INSERT ON public.ride_tracking_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_log_geography();

-- ==========================================
-- 08. PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 09. WALLETS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'ride_payment', 'ride_earnings', 'refund')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (id, balance)
  VALUES (new.id, 0.00);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

CREATE OR REPLACE FUNCTION public.update_wallet_balance_from_transaction()
RETURNS trigger AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + new.amount
  WHERE id = new.wallet_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_wallet_transaction_inserted
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance_from_transaction();

-- ==========================================
-- 10. RATINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.update_driver_average_rating()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.driver_profiles WHERE id = new.ratee_id) THEN
    UPDATE public.driver_profiles
    SET rating = (
      SELECT round(avg(rating)::numeric, 2)
      FROM public.ratings
      WHERE ratee_id = new.ratee_id
    )
    WHERE id = new.ratee_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_rating_inserted_update_driver
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_average_rating();

-- ==========================================
-- 11. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 12. ADMIN SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('commission_percentage', '15.00', 'Percentage ZipRide takes from each completed trip'),
  ('base_cancellation_fee', '2.00', 'Cancellation fee charged to riders when driver accepted'),
  ('minimum_distance_miles', '0.50', 'Minimum distance required to book a ride')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- ==========================================
-- 13. STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public uploads to verification bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from verification bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public all access to verification bucket" ON storage.objects;
CREATE POLICY "Allow public all access to verification bucket" ON storage.objects
  FOR ALL
  USING (bucket_id = 'verification-documents')
  WITH CHECK (bucket_id = 'verification-documents');

-- ==========================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

-- Driver Profiles Policies
CREATE POLICY "Allow public select driver_profiles" ON public.driver_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert driver_profiles" ON public.driver_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update driver_profiles" ON public.driver_profiles FOR UPDATE USING (true);

-- Vehicles Policies
CREATE POLICY "Allow public select vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update vehicles" ON public.vehicles FOR UPDATE USING (true);

-- Driver Locations Policies
CREATE POLICY "Allow public select driver_locations" ON public.driver_locations FOR SELECT USING (true);
CREATE POLICY "Allow public insert driver_locations" ON public.driver_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update driver_locations" ON public.driver_locations FOR UPDATE USING (true);

-- Rides Policies
CREATE POLICY "Allow public select rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Allow public insert rides" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rides" ON public.rides FOR UPDATE USING (true);

-- Ride Tracking Logs Policies
CREATE POLICY "Allow public select ride_tracking_logs" ON public.ride_tracking_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert ride_tracking_logs" ON public.ride_tracking_logs FOR INSERT WITH CHECK (true);

-- Payments Policies
CREATE POLICY "Allow public select payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update payments" ON public.payments FOR UPDATE USING (true);

-- Wallets Policies
CREATE POLICY "Allow public select wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Allow public insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update wallets" ON public.wallets FOR UPDATE USING (true);

-- Wallet Transactions Policies
CREATE POLICY "Allow public select wallet_transactions" ON public.wallet_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert wallet_transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- Ratings Policies
CREATE POLICY "Allow public select ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Allow public insert ratings" ON public.ratings FOR INSERT WITH CHECK (true);

-- Notifications Policies
CREATE POLICY "Allow public select notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON public.notifications FOR UPDATE USING (true);

-- Admin Settings Policies
CREATE POLICY "Allow public select admin_settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update admin_settings" ON public.admin_settings FOR UPDATE USING (true);

-- Admin Audit Logs Policies
CREATE POLICY "Allow public select admin_audit_logs" ON public.admin_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert admin_audit_logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (true);

-- ==========================================
-- 15. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON public.driver_profiles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);

CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON public.payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON public.ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings(ratee_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_by_user 
  ON public.notifications(user_id) 
  WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_driver_locations_spatial_coords 
  ON public.driver_locations USING GIST (coords);

CREATE INDEX IF NOT EXISTS idx_rides_pickup_spatial_coords 
  ON public.rides USING GIST (pickup_coords);

CREATE INDEX IF NOT EXISTS idx_rides_dropoff_spatial_coords 
  ON public.rides USING GIST (dropoff_coords);

CREATE INDEX IF NOT EXISTS idx_ride_tracking_logs_spatial_coords 
  ON public.ride_tracking_logs USING GIST (coords);

-- ==========================================
-- 16. PLATFORM SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public select platform_settings" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public insert platform_settings" ON public.platform_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update platform_settings" ON public.platform_settings;
CREATE POLICY "Allow public update platform_settings" ON public.platform_settings FOR UPDATE USING (true);

INSERT INTO public.platform_settings (key, value) VALUES 
  ('base_fare', '40'),
  ('per_km_rate', '12'),
  ('commission', '20'),
  ('cancellation_fee', '25'),
  ('surge_pricing', 'true'),
  ('auto_approve', 'false'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==========================================
-- 17. ADDITIONAL COLUMNS (OTP & BANS)
-- ==========================================
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS otp TEXT;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
