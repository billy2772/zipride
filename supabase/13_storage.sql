-- Create storage bucket for driver document proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Enable insert permissions on storage objects for own folders
CREATE POLICY "Allow drivers to upload docs to their folders" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: Enable select permissions on storage objects for own folders
CREATE POLICY "Allow drivers to read own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policy: Allow admins full read/delete access on verification documents
CREATE POLICY "Allow admins full access to documents" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );
