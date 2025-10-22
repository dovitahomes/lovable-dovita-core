-- Create storage policies for signatures bucket
CREATE POLICY "Users can upload their own signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firmas' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'firmas' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'firmas' 
  AND public.has_role(auth.uid(), 'admin')
);