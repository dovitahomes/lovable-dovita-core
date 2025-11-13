-- Sprint 1: Agregar meeting_link a eventos y crear vista de miembros del proyecto

-- 1. Agregar columna meeting_link a project_events
ALTER TABLE public.project_events 
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN public.project_events.meeting_link IS 
  'URL de la reunión virtual (Zoom, Google Meet, etc.)';

-- 2. Actualizar vista v_client_events para incluir meeting_link
DROP VIEW IF EXISTS public.v_client_events;

CREATE VIEW public.v_client_events AS
SELECT 
  pe.id,
  pe.project_id,
  pe.title,
  pe.description,
  pe.start_time,
  pe.end_time,
  pe.location,
  pe.meeting_link,
  pe.notes,
  pe.status,
  pe.event_type,
  pe.visibility,
  pe.created_by,
  pe.created_at,
  p.full_name as created_by_name
FROM public.project_events pe
LEFT JOIN public.profiles p ON p.id = pe.created_by
WHERE pe.visibility = 'client';

COMMENT ON VIEW public.v_client_events IS 
  'Vista para Client App: eventos visibles al cliente con meeting_link incluido.';

-- 3. Crear vista v_client_project_members (sin columna is_active que no existe)
CREATE OR REPLACE VIEW public.v_client_project_members AS
SELECT 
  pc.project_id,
  pc.user_id,
  pc.role,
  p.full_name,
  p.email,
  p.avatar_url,
  pc.created_at
FROM public.project_collaborators pc
LEFT JOIN public.profiles p ON p.id = pc.user_id
ORDER BY pc.created_at;

COMMENT ON VIEW public.v_client_project_members IS 
  'Vista para Client App: miembros del equipo del proyecto.';

-- 4. RLS para v_client_project_members
-- Las vistas heredan las políticas de las tablas base (project_collaborators y profiles)
-- No se requieren políticas adicionales ya que project_collaborators tiene RLS activo