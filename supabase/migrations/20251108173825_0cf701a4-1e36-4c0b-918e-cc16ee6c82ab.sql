-- =============================================
-- LIMPIEZA QUIRÚRGICA DE POLÍTICAS RLS
-- Elimina redundancias y estandariza nomenclatura
-- =============================================

BEGIN;

-- =============================================
-- PARTE 1: LIMPIAR POLÍTICAS REDUNDANTES EN DOCUMENTS
-- =============================================

-- Eliminar política redundante con nombre largo
DROP POLICY IF EXISTS "Clients see own project documents" ON public.documents;

-- Mantener solo:
-- - client_view_documents (usa user_can_access_project correctamente)
-- - collaborator_view_documents
-- - admin_all_documents

-- =============================================
-- PARTE 2: ESTANDARIZAR NOMENCLATURA EN LEADS
-- =============================================

-- Actualizar política de admin para usar current_user_has_role consistentemente
DROP POLICY IF EXISTS "admin_all_leads" ON public.leads;

CREATE POLICY "admin_all_leads"
ON public.leads
FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

-- =============================================
-- PARTE 3: VERIFICAR POLÍTICAS DE CONSTRUCTION_STAGES
-- =============================================

-- Agregar política SELECT para clientes (si no existe)
DROP POLICY IF EXISTS "client_view_construction_stages" ON public.construction_stages;

CREATE POLICY "client_view_construction_stages"
ON public.construction_stages
FOR SELECT
TO authenticated
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
);

-- =============================================
-- PARTE 4: VERIFICAR POLÍTICAS DE CONSTRUCTION_PHOTOS
-- =============================================

-- Agregar política SELECT para clientes (si no existe)
DROP POLICY IF EXISTS "client_view_construction_photos" ON public.construction_photos;

CREATE POLICY "client_view_construction_photos"
ON public.construction_photos
FOR SELECT
TO authenticated
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
);

-- =============================================
-- PARTE 5: VERIFICAR POLÍTICAS DE DESIGN_DELIVERABLES
-- =============================================

-- Ya existe client_view_design_deliverables, verificar que usa el patrón correcto
DROP POLICY IF EXISTS "client_view_design_deliverables" ON public.design_deliverables;

CREATE POLICY "client_view_design_deliverables"
ON public.design_deliverables
FOR SELECT
TO authenticated
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
);

-- =============================================
-- PARTE 6: RECARGAR SCHEMA DE POSTGREST
-- =============================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =============================================

-- Listar políticas activas en documents
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'documents'
ORDER BY policyname;

-- Listar políticas activas en leads
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY policyname;

-- Listar políticas activas en construction_stages
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'construction_stages'
ORDER BY policyname;