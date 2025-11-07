-- ============================================
-- MIGRACIÓN: Proteger tablas auxiliares con RLS
-- Descripción: Habilitar RLS y crear políticas para audit_rule_changes, price_history, 
--              pricing_config, budget_templates, wishlists
-- ============================================

-- ==============================
-- TABLA: audit_rule_changes (auditoría de cambios de reglas)
-- ==============================
ALTER TABLE audit_rule_changes ENABLE ROW LEVEL SECURITY;

-- Solo admin puede ver historial de auditoría
CREATE POLICY "admin_view_audit_rule_changes"
ON audit_rule_changes FOR SELECT
TO authenticated
USING (current_user_has_role('admin'));

-- Sistema puede insertar cambios (SECURITY DEFINER functions)
CREATE POLICY "system_insert_audit_rule_changes"
ON audit_rule_changes FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================
-- TABLA: price_history (historial de precios)
-- ==============================
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todo el historial
CREATE POLICY "admin_all_price_history"
ON price_history FOR ALL
TO authenticated
USING (current_user_has_role('admin'));

-- Usuarios con permiso de presupuestos pueden ver
CREATE POLICY "presupuestos_view_price_history"
ON price_history FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin') 
  OR user_has_module_permission(auth.uid(), 'presupuestos', 'view')
);

-- Sistema puede insertar (desde triggers o funciones)
CREATE POLICY "system_insert_price_history"
ON price_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================
-- TABLA: pricing_config (configuración de precios)
-- ==============================
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Admin puede todo
CREATE POLICY "admin_all_pricing_config"
ON pricing_config FOR ALL
TO authenticated
USING (current_user_has_role('admin'));

-- Usuarios con permiso de presupuestos pueden ver configuración
CREATE POLICY "presupuestos_view_pricing_config"
ON pricing_config FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin') 
  OR user_has_module_permission(auth.uid(), 'presupuestos', 'view')
);

-- Solo admin puede actualizar configuración
CREATE POLICY "admin_update_pricing_config"
ON pricing_config FOR UPDATE
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

-- ==============================
-- TABLA: budget_templates (plantillas de presupuestos)
-- ==============================
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

-- Admin puede todo
CREATE POLICY "admin_all_budget_templates"
ON budget_templates FOR ALL
TO authenticated
USING (current_user_has_role('admin'));

-- Usuarios con permiso de presupuestos pueden ver plantillas
CREATE POLICY "presupuestos_view_budget_templates"
ON budget_templates FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin') 
  OR user_has_module_permission(auth.uid(), 'presupuestos', 'view')
);

-- Usuarios con permiso de crear presupuestos pueden crear plantillas
CREATE POLICY "presupuestos_create_budget_templates"
ON budget_templates FOR INSERT
TO authenticated
WITH CHECK (
  current_user_has_role('admin') 
  OR user_has_module_permission(auth.uid(), 'presupuestos', 'create')
);

-- Usuarios con permiso de editar presupuestos pueden editar sus plantillas
CREATE POLICY "presupuestos_update_budget_templates"
ON budget_templates FOR UPDATE
TO authenticated
USING (
  current_user_has_role('admin') 
  OR (user_has_module_permission(auth.uid(), 'presupuestos', 'edit') AND created_by = auth.uid())
)
WITH CHECK (
  current_user_has_role('admin') 
  OR (user_has_module_permission(auth.uid(), 'presupuestos', 'edit') AND created_by = auth.uid())
);

-- Usuarios pueden eliminar sus propias plantillas
CREATE POLICY "presupuestos_delete_budget_templates"
ON budget_templates FOR DELETE
TO authenticated
USING (
  current_user_has_role('admin') 
  OR (user_has_module_permission(auth.uid(), 'presupuestos', 'delete') AND created_by = auth.uid())
);

-- ==============================
-- TABLA: wishlists (listas de deseos de clientes)
-- ==============================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todo
CREATE POLICY "admin_all_wishlists"
ON wishlists FOR ALL
TO authenticated
USING (current_user_has_role('admin'));

-- Clientes pueden ver sus propias listas
CREATE POLICY "client_view_own_wishlists"
ON wishlists FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin')
  OR user_can_access_project(auth.uid(), project_id)
);

-- Clientes pueden crear sus propias listas
CREATE POLICY "client_create_wishlists"
ON wishlists FOR INSERT
TO authenticated
WITH CHECK (
  current_user_has_role('admin')
  OR user_can_access_project(auth.uid(), project_id)
);

-- Clientes pueden actualizar sus propias listas
CREATE POLICY "client_update_wishlists"
ON wishlists FOR UPDATE
TO authenticated
USING (
  current_user_has_role('admin')
  OR user_can_access_project(auth.uid(), project_id)
)
WITH CHECK (
  current_user_has_role('admin')
  OR user_can_access_project(auth.uid(), project_id)
);

-- Clientes pueden eliminar sus propias listas
CREATE POLICY "client_delete_wishlists"
ON wishlists FOR DELETE
TO authenticated
USING (
  current_user_has_role('admin')
  OR user_can_access_project(auth.uid(), project_id)
);

-- Colaboradores con permiso de proyectos pueden ver wishlists
CREATE POLICY "collaborator_view_wishlists"
ON wishlists FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin')
  OR (user_can_access_project(auth.uid(), project_id) AND user_has_module_permission(auth.uid(), 'proyectos', 'view'))
);

-- ==============================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ==============================
COMMENT ON TABLE audit_rule_changes IS 'Auditoría de cambios en reglas de negocio - Solo lectura para admin';
COMMENT ON TABLE price_history IS 'Historial de precios de subpartidas - Visible para usuarios con permiso de presupuestos';
COMMENT ON TABLE pricing_config IS 'Configuración de umbrales de variación de precios - Admin configura, presupuestos lee';
COMMENT ON TABLE budget_templates IS 'Plantillas de presupuestos reutilizables - Gestionadas por usuarios con permisos de presupuestos';
COMMENT ON TABLE wishlists IS 'Listas de deseos de clientes para proyectos - Clientes gestionan sus propias listas';