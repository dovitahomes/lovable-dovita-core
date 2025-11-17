-- FASE 1: Modificar estructura de BD para Calendario Universal
-- Permite eventos de proyectos, leads y personales

-- 1.1 Hacer project_id NULLABLE en project_events
ALTER TABLE project_events 
ALTER COLUMN project_id DROP NOT NULL;

-- 1.2 Agregar columna lead_id para vincular eventos con leads
ALTER TABLE project_events 
ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE CASCADE;

-- 1.3 Agregar columna entity_type para clarificar tipo de evento
ALTER TABLE project_events 
ADD COLUMN entity_type text CHECK (entity_type IN ('project', 'lead', 'personal'));

-- 1.4 Agregar constraint: debe tener project_id O lead_id O ser personal
ALTER TABLE project_events 
ADD CONSTRAINT check_event_entity 
CHECK (
  (project_id IS NOT NULL AND lead_id IS NULL AND entity_type = 'project') OR
  (lead_id IS NOT NULL AND project_id IS NULL AND entity_type = 'lead') OR
  (project_id IS NULL AND lead_id IS NULL AND entity_type = 'personal')
);

-- 1.5 Crear índices para optimización
CREATE INDEX idx_project_events_lead_id ON project_events(lead_id);
CREATE INDEX idx_project_events_created_by_entity ON project_events(created_by, entity_type);

-- 1.6 Actualizar eventos existentes marcándolos como 'project'
UPDATE project_events SET entity_type = 'project' WHERE project_id IS NOT NULL;

-- 1.7 Comentario explicativo
COMMENT ON COLUMN project_events.entity_type IS 'Tipo de entidad: project (eventos de proyectos), lead (reuniones con leads), personal (eventos personales del colaborador)';
COMMENT ON COLUMN project_events.lead_id IS 'ID del lead si el evento es una reunión con un lead (mutuamente excluyente con project_id)';
