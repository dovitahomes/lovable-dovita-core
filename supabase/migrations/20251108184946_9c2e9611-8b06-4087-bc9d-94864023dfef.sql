-- FASE 1: Consolidación de Eventos y Calendario
-- Unificar calendar_events → project_events

-- 1. Drop vistas primero para evitar conflictos
DROP VIEW IF EXISTS public.v_client_events CASCADE;
DROP VIEW IF EXISTS public.v_client_appointments CASCADE;

-- 2. Agregar columnas necesarias a project_events
ALTER TABLE public.project_events 
ADD COLUMN IF NOT EXISTS visibilidad TEXT DEFAULT 'cliente',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Migrar datos de calendar_events a project_events
INSERT INTO public.project_events (
  id,
  project_id,
  created_by,
  title,
  description,
  start_time,
  end_time,
  status,
  visibilidad,
  location,
  notes,
  created_at
)
SELECT 
  id,
  project_id,
  created_by,
  title,
  notes AS description,
  start_at AS start_time,
  end_at AS end_time,
  'aceptada'::text AS status,
  'cliente'::text AS visibilidad,
  NULL AS location,
  notes,
  created_at
FROM public.calendar_events
ON CONFLICT (id) DO NOTHING;

-- 4. Drop tabla calendar_events
DROP TABLE IF EXISTS public.calendar_events CASCADE;

-- 5. Recrear vista v_client_events con todas las columnas correctas
CREATE OR REPLACE VIEW public.v_client_events AS
SELECT 
  pe.id,
  pe.project_id,
  pe.title,
  pe.description,
  pe.start_time,
  pe.end_time,
  pe.location,
  pe.notes,
  pe.status,
  pe.visibilidad,
  pe.created_by,
  pe.created_at,
  p.full_name AS created_by_name
FROM public.project_events pe
LEFT JOIN public.profiles p ON p.id = pe.created_by
WHERE pe.visibilidad = 'cliente';

-- 6. Notificar a PostgREST para recargar schema
NOTIFY pgrst, 'reload schema';