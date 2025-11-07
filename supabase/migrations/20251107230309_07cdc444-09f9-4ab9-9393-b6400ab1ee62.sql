-- Unified User Management Module Migration - Fixed
-- Extends profiles table, creates user_documents table and storage bucket

-- 1. Extend profiles table with employee-specific fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS rfc TEXT,
  ADD COLUMN IF NOT EXISTS imss_number TEXT,
  ADD COLUMN IF NOT EXISTS fecha_ingreso DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- 2. Create user_documents table for employee files
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_documents
CREATE POLICY "admin_all_user_documents" 
  ON public.user_documents FOR ALL 
  USING (current_user_has_role('admin'));

CREATE POLICY "users_view_own_documents" 
  ON public.user_documents FOR SELECT 
  USING (auth.uid() = user_id OR current_user_has_role('admin'));

-- 3. Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS for storage bucket
CREATE POLICY "admin_all_user_docs_storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'user-documents' AND current_user_has_role('admin'));

CREATE POLICY "users_view_own_docs_storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Drop and recreate vw_users_extended view to include new fields
DROP VIEW IF EXISTS public.vw_users_extended;

CREATE VIEW public.vw_users_extended AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.created_at,
  p.updated_at,
  p.fecha_nacimiento,
  p.avatar_url,
  p.rfc,
  p.imss_number,
  p.fecha_ingreso,
  p.emergency_contact,
  COALESCE(
    ARRAY_AGG(ur.role_name ORDER BY ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL),
    ARRAY[]::text[]
  ) AS roles,
  um.sucursal_id,
  s.nombre AS sucursal_nombre
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.user_metadata um ON um.user_id = p.id
LEFT JOIN public.sucursales s ON s.id = um.sucursal_id
GROUP BY p.id, p.email, p.full_name, p.phone, p.created_at, p.updated_at, 
         p.fecha_nacimiento, p.avatar_url, p.rfc, p.imss_number, 
         p.fecha_ingreso, p.emergency_contact,
         um.sucursal_id, s.nombre;