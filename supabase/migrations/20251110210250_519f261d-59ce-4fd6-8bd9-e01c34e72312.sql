-- Fase 1: Migración del Sistema de Calendario Unificado (Final)

-- 1.1 Actualizar tabla project_events con nuevos campos
ALTER TABLE project_events
ADD COLUMN IF NOT EXISTS visibility TEXT 
  CHECK (visibility IN ('client', 'team'))
  DEFAULT 'team';

ALTER TABLE project_events
ADD COLUMN IF NOT EXISTS event_type TEXT
  CHECK (event_type IN ('meeting', 'site_visit', 'review', 'deadline', 'other'))
  DEFAULT 'meeting';

ALTER TABLE project_events
ADD COLUMN IF NOT EXISTS location TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN project_events.visibility IS 
  'client: visible para el cliente en Client App | team: solo visible para el equipo interno';
  
COMMENT ON COLUMN project_events.event_type IS 
  'Tipo de evento: meeting (reunión), site_visit (visita de obra), review (revisión), deadline (fecha límite), other (otro)';

COMMENT ON COLUMN project_events.location IS 
  'Ubicación física o virtual del evento (ej: Zoom, dirección de obra, oficina)';

-- 1.2 Eliminar y recrear vista v_client_events para filtrar por visibilidad
DROP VIEW IF EXISTS v_client_events;

CREATE VIEW v_client_events AS
SELECT 
  pe.id,
  pe.project_id,
  pe.title,
  pe.description,
  pe.start_time,
  pe.end_time,
  pe.location,
  pe.status,
  pe.event_type,
  pe.visibility,
  pe.created_by,
  p.full_name AS created_by_name,
  pe.created_at
FROM project_events pe
LEFT JOIN profiles p ON p.id = pe.created_by
WHERE pe.visibility = 'client' -- Solo eventos visibles al cliente
  AND pe.status != 'cancelada'; -- Excluir eventos cancelados

-- 1.3 Crear índices para optimizar queries de calendario
CREATE INDEX IF NOT EXISTS idx_project_events_start_time ON project_events(start_time);
CREATE INDEX IF NOT EXISTS idx_project_events_project_visibility ON project_events(project_id, visibility);
CREATE INDEX IF NOT EXISTS idx_project_events_event_type ON project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_project_events_created_by ON project_events(created_by);