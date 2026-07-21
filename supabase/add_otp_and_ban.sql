-- Run this in your Supabase SQL Editor:

-- 1. Add otp column to rides table
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS otp TEXT;

-- 2. Add banned column or logic to driver_profiles
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
