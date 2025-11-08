-- ============================================
-- Parte 1: Storage RLS para Client App
-- ============================================

-- 1. Función helper para obtener proyectos del usuario
CREATE OR REPLACE FUNCTION public.get_user_project_ids(p_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT project_id)
  FROM (
    -- Proyectos donde el usuario es colaborador
    SELECT project_id 
    FROM public.project_collaborators 
    WHERE user_id = p_user_id
    
    UNION
    
    -- Proyectos del cliente (si el usuario está vinculado a un cliente)
    SELECT p.id as project_id
    FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.email = (SELECT email FROM auth.users WHERE id = p_user_id)
  ) all_projects;
$$;

-- 2. Verificar y crear buckets si no existen (privados)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('project_docs', 'project_docs', false),
  ('project_photos', 'project_photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 3. Limpiar políticas existentes de project_docs (si existen)
DROP POLICY IF EXISTS "auth_can_insert_project_docs" ON storage.objects;
DROP POLICY IF EXISTS "auth_can_read_project_docs" ON storage.objects;
DROP POLICY IF EXISTS "owner_can_delete_project_docs" ON storage.objects;
DROP POLICY IF EXISTS "Clients can read their project docs" ON storage.objects;
DROP POLICY IF EXISTS "Staff full access to project docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload project docs" ON storage.objects;

-- 4. Políticas RLS para project_docs
CREATE POLICY "Clients can read their project docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project_docs'
  AND split_part(name, '/', 1)::uuid = ANY(
    public.get_user_project_ids(auth.uid())
  )
);

CREATE POLICY "Staff full access to project docs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project_docs'
  AND (
    public.current_user_has_role('admin')
    OR public.current_user_has_role('colaborador')
  )
);

CREATE POLICY "Authenticated can upload project docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project_docs');

-- 5. Limpiar políticas existentes de project_photos (si existen)
DROP POLICY IF EXISTS "Clients can read their project photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff full access to project photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload project photos" ON storage.objects;

-- 6. Políticas RLS para project_photos
CREATE POLICY "Clients can read their project photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project_photos'
  AND split_part(name, '/', 1)::uuid = ANY(
    public.get_user_project_ids(auth.uid())
  )
);

CREATE POLICY "Staff full access to project photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project_photos'
  AND (
    public.current_user_has_role('admin')
    OR public.current_user_has_role('colaborador')
  )
);

CREATE POLICY "Authenticated can upload project photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project_photos');