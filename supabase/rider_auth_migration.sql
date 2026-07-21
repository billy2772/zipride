-- ==========================================
-- RIDER USERNAME/PASSWORD AUTH MIGRATION
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add username, password_hash, phone_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- 2. Index for fast username lookups
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username) WHERE username IS NOT NULL;

-- 3. Index for unique phone per role
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone) WHERE phone IS NOT NULL;
