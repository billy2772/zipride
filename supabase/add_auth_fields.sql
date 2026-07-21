-- Run this in your Supabase SQL Editor:

-- 1. Ensure Row Level Security (RLS) is ENABLED on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Add custom fields if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_expiry TEXT,
ADD COLUMN IF NOT EXISTS license_image_url TEXT,
ADD COLUMN IF NOT EXISTS rc_book_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_images TEXT[];

-- 3. Drop existing restricting policies so we can create open ones
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Allow public read access to driver profiles" ON public.driver_profiles;
DROP POLICY IF EXISTS "Allow drivers to update own profile" ON public.driver_profiles;

DROP POLICY IF EXISTS "Allow public read access to active vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow drivers to modify own vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Allow riders/drivers/admins to view relevant rides" ON public.rides;
DROP POLICY IF EXISTS "Allow riders to create new rides" ON public.rides;
DROP POLICY IF EXISTS "Allow riders/drivers to update relevant rides" ON public.rides;

DROP POLICY IF EXISTS "Allow participants to view relevant payments" ON public.payments;

DROP POLICY IF EXISTS "Allow wallet owners to view own balance" ON public.wallets;
DROP POLICY IF EXISTS "Allow wallet owners to view own ledger entries" ON public.wallet_transactions;

DROP POLICY IF EXISTS "Allow participants to view relevant reviews" ON public.ratings;
DROP POLICY IF EXISTS "Allow users to post ratings" ON public.ratings;

DROP POLICY IF EXISTS "Allow users to view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to modify own notifications read status" ON public.notifications;

-- 4. Create open RLS policies (using TO public) so the client (via Anon key) can query/write
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

-- Rides Policies
CREATE POLICY "Allow public select rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Allow public insert rides" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rides" ON public.rides FOR UPDATE USING (true);

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
