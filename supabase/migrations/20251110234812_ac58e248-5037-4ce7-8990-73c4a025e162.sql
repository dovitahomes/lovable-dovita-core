-- Migration: Coordinación bidireccional de citas entre clientes y colaboradores
-- Permite que clientes acepten/rechacen propuestas de colaboradores y cancelen sus propias solicitudes

-- Policy 1: Cliente puede aceptar o rechazar propuestas de colaboradores
CREATE POLICY client_update_event_status
ON project_events
FOR UPDATE
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
  AND visibility = 'client'
  AND created_by != auth.uid() -- Propuestas de colaboradores
)
WITH CHECK (
  visibility = 'client' -- No pueden cambiar visibilidad
  AND status IN ('aceptada', 'rechazada') -- Solo aceptar/rechazar
);

-- Policy 2: Cliente puede cancelar sus propias solicitudes pendientes
CREATE POLICY client_cancel_own_proposals
ON project_events
FOR UPDATE
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
  AND visibility = 'client'
  AND status = 'propuesta'
  AND created_by = auth.uid() -- Solo propias
)
WITH CHECK (
  visibility = 'client'
  AND status = 'cancelada' -- Solo cancelar
);