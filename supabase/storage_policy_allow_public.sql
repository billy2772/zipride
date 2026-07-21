-- Run this in your Supabase SQL Editor:

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent conflict errors
DROP POLICY IF EXISTS "Allow drivers to upload docs to their folders" ON storage.objects;
DROP POLICY IF EXISTS "Allow drivers to read own docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins full access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to verification bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from verification bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public all access to verification bucket" ON storage.objects;

-- 3. Create public all-access policy
CREATE POLICY "Allow public all access to verification bucket" ON storage.objects
  FOR ALL
  USING (bucket_id = 'verification-documents')
  WITH CHECK (bucket_id = 'verification-documents');
