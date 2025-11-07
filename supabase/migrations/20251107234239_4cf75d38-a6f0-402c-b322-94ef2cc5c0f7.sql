-- ============================================
-- Fix RLS policies for user_documents table
-- ============================================

-- Drop existing generic policy if it exists
DROP POLICY IF EXISTS "admin_all_user_documents" ON user_documents;
DROP POLICY IF EXISTS "users_view_own_documents" ON user_documents;

-- Create granular policies for admins (all operations)
CREATE POLICY "admins_view_all_user_documents"
ON user_documents FOR SELECT
TO authenticated
USING (current_user_has_role('admin'::text));

CREATE POLICY "admins_insert_user_documents"
ON user_documents FOR INSERT
TO authenticated
WITH CHECK (current_user_has_role('admin'::text));

CREATE POLICY "admins_update_user_documents"
ON user_documents FOR UPDATE
TO authenticated
USING (current_user_has_role('admin'::text))
WITH CHECK (current_user_has_role('admin'::text));

CREATE POLICY "admins_delete_user_documents"
ON user_documents FOR DELETE
TO authenticated
USING (current_user_has_role('admin'::text));

-- Policies for users to manage their own documents
CREATE POLICY "users_view_own_documents"
ON user_documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_documents"
ON user_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_documents"
ON user_documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Fix RLS policies for user-documents storage bucket
-- ============================================

-- Drop existing policies on storage.objects for user-documents bucket
DROP POLICY IF EXISTS "admins_all_user_documents_storage" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own_documents_storage" ON storage.objects;
DROP POLICY IF EXISTS "users_upload_own_documents_storage" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_documents_storage" ON storage.objects;

-- Admin policies: full access to all documents in user-documents bucket
CREATE POLICY "admins_all_user_documents_storage"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  current_user_has_role('admin'::text)
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  current_user_has_role('admin'::text)
);

-- User policies: access only their own folder (userId/*)
CREATE POLICY "users_view_own_documents_storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users_upload_own_documents_storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users_delete_own_documents_storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);