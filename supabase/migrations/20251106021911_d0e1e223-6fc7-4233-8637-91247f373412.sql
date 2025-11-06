-- =====================================================
-- FASE 7: Políticas RLS para Client App
-- =====================================================
-- Asegurar que clientes solo vean sus propios datos
-- y colaboradores puedan ver todos los datos

-- =====================================================
-- 1. HABILITAR RLS EN TABLAS PRINCIPALES
-- =====================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREAR FUNCIÓN HELPER PARA VERIFICAR SI ES COLABORADOR
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_collaborator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'colaborador', 'contador')
  );
$$;

-- =====================================================
-- 3. CREAR FUNCIÓN PARA OBTENER CLIENT_ID DEL USUARIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_client_id_from_auth()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$;

-- =====================================================
-- 4. POLÍTICAS PARA TABLA CLIENTS
-- =====================================================

-- Clientes pueden ver su propio registro
CREATE POLICY "Clients can view own record"
ON public.clients
FOR SELECT
TO authenticated
USING (
  email = auth.jwt()->>'email'
  OR public.is_collaborator()
);

-- =====================================================
-- 5. POLÍTICAS PARA TABLA PROJECTS
-- =====================================================

-- Clientes ven sus propios proyectos
CREATE POLICY "Clients see own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  client_id = public.get_client_id_from_auth()
  OR public.is_collaborator()
);

-- =====================================================
-- 6. POLÍTICAS PARA TABLA DOCUMENTS
-- =====================================================

-- Clientes ven documentos de sus proyectos (solo visibilidad 'cliente')
CREATE POLICY "Clients see own project documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  (
    project_id IN (
      SELECT id FROM public.projects
      WHERE client_id = public.get_client_id_from_auth()
    )
    AND visibilidad = 'cliente'
  )
  OR public.is_collaborator()
);

-- =====================================================
-- 7. POLÍTICAS PARA TABLA CONSTRUCTION_PHOTOS
-- =====================================================

-- Clientes ven fotos de sus proyectos (solo visibilidad 'cliente')
CREATE POLICY "Clients see own project photos"
ON public.construction_photos
FOR SELECT
TO authenticated
USING (
  (
    project_id IN (
      SELECT id FROM public.projects
      WHERE client_id = public.get_client_id_from_auth()
    )
    AND visibilidad = 'cliente'
  )
  OR public.is_collaborator()
);

-- =====================================================
-- 8. POLÍTICAS PARA TABLA CALENDAR_EVENTS
-- =====================================================

-- Clientes ven eventos de sus proyectos
CREATE POLICY "Clients see own project events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE client_id = public.get_client_id_from_auth()
  )
  OR public.is_collaborator()
);

-- =====================================================
-- 9. POLÍTICAS PARA TABLA DESIGN_DELIVERABLES
-- =====================================================

-- Clientes ven entregables de diseño de sus proyectos
CREATE POLICY "Clients see own project deliverables"
ON public.design_deliverables
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE client_id = public.get_client_id_from_auth()
  )
  OR public.is_collaborator()
);

-- =====================================================
-- 10. POLÍTICAS PARA TABLA DESIGN_CHANGE_LOGS
-- =====================================================

-- Clientes ven cambios de diseño de sus proyectos
CREATE POLICY "Clients see own project change logs"
ON public.design_change_logs
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE client_id = public.get_client_id_from_auth()
  )
  OR public.is_collaborator()
);

-- =====================================================
-- 11. POLÍTICAS PARA TABLA PROJECT_MESSAGES
-- =====================================================

-- Clientes ven mensajes de sus proyectos
CREATE POLICY "Clients see own project messages"
ON public.project_messages
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE client_id = public.get_client_id_from_auth()
  )
  OR public.is_collaborator()
);

-- Clientes pueden insertar mensajes en sus proyectos
CREATE POLICY "Clients can send messages in own projects"
ON public.project_messages
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects
    WHERE client_id = public.get_client_id_from_auth()
  )
  AND sender_id = auth.uid()
);

-- =====================================================
-- 12. COMENTARIOS Y NOTAS
-- =====================================================

COMMENT ON FUNCTION public.is_collaborator() IS 'Verifica si el usuario autenticado es un colaborador (admin, colaborador o contador)';
COMMENT ON FUNCTION public.get_client_id_from_auth() IS 'Obtiene el client_id del cliente autenticado basado en su email';

-- =====================================================
-- FIN DE POLÍTICAS RLS
-- =====================================================