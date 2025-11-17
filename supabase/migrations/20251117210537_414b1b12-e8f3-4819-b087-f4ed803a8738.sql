-- =====================================================
-- FASE 1: Políticas RLS para Eventos de Leads y Personales
-- =====================================================
-- Objetivo: Permitir que eventos sin project_id (leads y personales) 
-- sean accesibles sin romper funcionalidad existente de proyectos

-- 1. Política SELECT para eventos de leads (colaboradores ven los que crearon)
CREATE POLICY "colaboradores_view_lead_events"
ON project_events
FOR SELECT
TO authenticated
USING (
  entity_type = 'lead' 
  AND created_by = auth.uid()
);

-- 2. Política SELECT para eventos personales
CREATE POLICY "colaboradores_view_personal_events"
ON project_events
FOR SELECT
TO authenticated
USING (
  entity_type = 'personal' 
  AND created_by = auth.uid()
);

-- 3. Política INSERT para eventos de leads
CREATE POLICY "colaboradores_insert_lead_events"
ON project_events
FOR INSERT
TO authenticated
WITH CHECK (
  entity_type = 'lead'
  AND lead_id IS NOT NULL
  AND created_by = auth.uid()
);

-- 4. Política INSERT para eventos personales
CREATE POLICY "colaboradores_insert_personal_events"
ON project_events
FOR INSERT
TO authenticated
WITH CHECK (
  entity_type = 'personal'
  AND project_id IS NULL
  AND lead_id IS NULL
  AND created_by = auth.uid()
);

-- 5. Política UPDATE para eventos de leads (solo el creador)
CREATE POLICY "colaboradores_update_lead_events"
ON project_events
FOR UPDATE
TO authenticated
USING (
  entity_type = 'lead'
  AND created_by = auth.uid()
)
WITH CHECK (
  entity_type = 'lead'
  AND created_by = auth.uid()
);

-- 6. Política UPDATE para eventos personales
CREATE POLICY "colaboradores_update_personal_events"
ON project_events
FOR UPDATE
TO authenticated
USING (
  entity_type = 'personal'
  AND created_by = auth.uid()
)
WITH CHECK (
  entity_type = 'personal'
  AND created_by = auth.uid()
);

-- 7. Política DELETE para eventos de leads
CREATE POLICY "colaboradores_delete_lead_events"
ON project_events
FOR DELETE
TO authenticated
USING (
  entity_type = 'lead'
  AND created_by = auth.uid()
);

-- 8. Política DELETE para eventos personales
CREATE POLICY "colaboradores_delete_personal_events"
ON project_events
FOR DELETE
TO authenticated
USING (
  entity_type = 'personal'
  AND created_by = auth.uid()
);

-- =====================================================
-- Comentarios para documentación
-- =====================================================

COMMENT ON POLICY "colaboradores_view_lead_events" ON project_events IS 
  'Colaboradores pueden ver eventos de leads que ellos crearon';

COMMENT ON POLICY "colaboradores_view_personal_events" ON project_events IS 
  'Colaboradores pueden ver sus propios eventos personales';

COMMENT ON POLICY "colaboradores_insert_lead_events" ON project_events IS 
  'Colaboradores pueden crear eventos de leads vinculados a un lead_id';

COMMENT ON POLICY "colaboradores_insert_personal_events" ON project_events IS 
  'Colaboradores pueden crear eventos personales sin project_id ni lead_id';

COMMENT ON POLICY "colaboradores_update_lead_events" ON project_events IS 
  'Colaboradores pueden editar eventos de leads que crearon';

COMMENT ON POLICY "colaboradores_update_personal_events" ON project_events IS 
  'Colaboradores pueden editar sus propios eventos personales';

COMMENT ON POLICY "colaboradores_delete_lead_events" ON project_events IS 
  'Colaboradores pueden eliminar eventos de leads que crearon';

COMMENT ON POLICY "colaboradores_delete_personal_events" ON project_events IS 
  'Colaboradores pueden eliminar sus propios eventos personales';