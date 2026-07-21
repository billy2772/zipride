-- Run this in your Supabase SQL Editor:

-- 1. Add firebase_uid column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- 2. Drop constraint requiring profiles.id to match Supabase internal auth users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Configure profiles.id to generate UUIDs automatically
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
