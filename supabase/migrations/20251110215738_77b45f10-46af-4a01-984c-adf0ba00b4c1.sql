-- Fase 5: Políticas RLS para colaboradores gestionar eventos con visibility='client'

-- Policy para que colaboradores puedan ver eventos de sus proyectos (incluyendo visibility='client')
CREATE POLICY "collaborator_view_project_events"
ON project_events
FOR SELECT
USING (
  current_user_has_role('admin') 
  OR user_can_access_project(auth.uid(), project_id)
);

-- Policy para que colaboradores puedan actualizar eventos de sus proyectos (cambiar status)
CREATE POLICY "collaborator_update_project_events"
ON project_events
FOR UPDATE
USING (
  current_user_has_role('admin')
  OR (
    user_can_access_project(auth.uid(), project_id)
    AND user_has_module_permission(auth.uid(), 'calendario', 'edit')
  )
)
WITH CHECK (
  current_user_has_role('admin')
  OR (
    user_can_access_project(auth.uid(), project_id)
    AND user_has_module_permission(auth.uid(), 'calendario', 'edit')
  )
);

-- Policy para que colaboradores puedan crear eventos en sus proyectos
CREATE POLICY "collaborator_create_project_events"
ON project_events
FOR INSERT
WITH CHECK (
  current_user_has_role('admin')
  OR (
    user_can_access_project(auth.uid(), project_id)
    AND user_has_module_permission(auth.uid(), 'calendario', 'create')
  )
);

-- Policy para que colaboradores puedan eliminar eventos de sus proyectos
CREATE POLICY "collaborator_delete_project_events"
ON project_events
FOR DELETE
USING (
  current_user_has_role('admin')
  OR (
    user_can_access_project(auth.uid(), project_id)
    AND user_has_module_permission(auth.uid(), 'calendario', 'delete')
  )
);

-- Policy para que clientes vean solo eventos con visibility='client' de sus proyectos
CREATE POLICY "client_view_own_events"
ON project_events
FOR SELECT
USING (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
  AND visibility = 'client'
);

-- Policy para que clientes puedan crear eventos (solicitudes de cita) en sus proyectos
CREATE POLICY "client_create_own_events"
ON project_events
FOR INSERT
WITH CHECK (
  current_user_has_role('cliente')
  AND user_can_access_project(auth.uid(), project_id)
  AND visibility = 'client'
  AND status = 'propuesta'
);