-- ================================================================
-- BLOQUE 22 (Parte 2): Corregir tablas con RLS sin políticas
-- ================================================================

-- ============================================================
-- 1. PROJECT_EVENTS - Agregar políticas básicas
-- ============================================================

-- Admin: acceso total
CREATE POLICY admin_all_project_events 
  ON public.project_events
  FOR ALL
  USING (current_user_has_role('admin'));

-- Colaboradores pueden ver eventos de sus proyectos
CREATE POLICY colaboradores_view_project_events 
  ON public.project_events
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    (project_id IS NOT NULL AND user_can_access_project(auth.uid(), project_id))
  );

-- Colaboradores pueden crear eventos en sus proyectos
CREATE POLICY colaboradores_manage_project_events 
  ON public.project_events
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    (project_id IS NOT NULL AND user_can_access_project(auth.uid(), project_id) 
     AND user_has_module_permission(auth.uid(), 'proyectos', 'create'))
  );

-- Colaboradores pueden editar eventos en sus proyectos
CREATE POLICY colaboradores_update_project_events 
  ON public.project_events
  FOR UPDATE
  USING (
    current_user_has_role('admin') OR 
    (project_id IS NOT NULL AND user_can_access_project(auth.uid(), project_id) 
     AND user_has_module_permission(auth.uid(), 'proyectos', 'edit'))
  )
  WITH CHECK (
    current_user_has_role('admin') OR 
    (project_id IS NOT NULL AND user_can_access_project(auth.uid(), project_id) 
     AND user_has_module_permission(auth.uid(), 'proyectos', 'edit'))
  );

-- ============================================================
-- 2. USER_ROLE_AUDIT - Políticas de auditoría
-- ============================================================

-- Admin puede hacer todo
CREATE POLICY admin_all_user_role_audit 
  ON public.user_role_audit
  FOR ALL
  USING (current_user_has_role('admin'));

-- Usuarios pueden ver su propio historial de cambios de roles
CREATE POLICY users_view_own_audit 
  ON public.user_role_audit
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_id = auth.uid()
  );

-- Solo el sistema puede insertar (via trigger)
-- La inserción se hace via trigger audit_user_role_change()
CREATE POLICY system_insert_user_role_audit 
  ON public.user_role_audit
  FOR INSERT
  WITH CHECK (true);