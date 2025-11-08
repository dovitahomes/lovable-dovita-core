-- =============================================
-- REDISEÑO DE POLÍTICAS RLS PARA CLIENTS Y PROJECTS
-- Elimina consultas a auth.users y unifica políticas
-- =============================================

BEGIN;

-- =============================================
-- PARTE 1: LIMPIAR POLÍTICAS DE CLIENTS
-- =============================================

-- Eliminar políticas problemáticas que consultan auth.users
DROP POLICY IF EXISTS "client_view_own_record" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own record" ON public.clients;

-- Eliminar política redundante de colaboradores (la unificaremos)
DROP POLICY IF EXISTS "collaborator_view_clients" ON public.clients;

-- Crear política unificada para SELECT en clients
CREATE POLICY "select_clients_unified"
ON public.clients
FOR SELECT
TO authenticated
USING (
  -- Admin: acceso total a todos los clientes
  current_user_has_role('admin')
  
  OR
  
  -- Colaboradores y contadores con permiso explícito de 'clientes.view'
  user_has_module_permission(auth.uid(), 'clientes', 'view')
  
  OR
  
  -- Clientes ven solo su propio registro (por email del JWT)
  (
    current_user_has_role('cliente')
    AND email = (auth.jwt()->>'email')
  )
);

-- =============================================
-- PARTE 2: LIMPIAR POLÍTICAS DE PROJECTS
-- =============================================

-- Eliminar políticas problemáticas que consultan auth.users
DROP POLICY IF EXISTS "client_view_own_projects" ON public.projects;
DROP POLICY IF EXISTS "Clients see own projects" ON public.projects;

-- Eliminar política redundante de colaboradores (la unificaremos)
DROP POLICY IF EXISTS "collaborator_view_projects" ON public.projects;

-- Crear política unificada para SELECT en projects
CREATE POLICY "select_projects_unified"
ON public.projects
FOR SELECT
TO authenticated
USING (
  -- Admin: acceso total a todos los proyectos
  current_user_has_role('admin')
  
  OR
  
  -- Colaboradores con permiso y acceso al proyecto específico
  (
    user_has_module_permission(auth.uid(), 'proyectos', 'view')
    AND user_can_access_project(auth.uid(), id)
  )
  
  OR
  
  -- Clientes ven solo sus propios proyectos (por client_id)
  (
    current_user_has_role('cliente')
    AND client_id = get_client_id_from_auth()
  )
);

-- =============================================
-- PARTE 3: ACTUALIZAR FUNCIÓN user_can_access_project
-- Eliminar referencia a auth.users
-- =============================================

CREATE OR REPLACE FUNCTION public.user_can_access_project(p_user_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Admin: acceso total a todos los proyectos
    WHEN public.current_user_has_role('admin') THEN true
    
    -- Colaborador: solo proyectos donde está asignado en project_collaborators
    WHEN EXISTS (
      SELECT 1 FROM public.project_collaborators 
      WHERE user_id = p_user_id AND project_id = p_project_id
    ) THEN true
    
    -- Cliente: proyectos donde el client_id coincide con su registro en clients
    WHEN public.current_user_has_role('cliente') 
      AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id 
          AND client_id = public.get_client_id_from_auth()
      ) THEN true
    
    ELSE false
  END;
$$;

-- =============================================
-- PARTE 4: RECARGAR SCHEMA DE POSTGREST
-- =============================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =============================================

-- Listar políticas activas en clients
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'clients'
ORDER BY policyname;

-- Listar políticas activas en projects
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'projects'
ORDER BY policyname;