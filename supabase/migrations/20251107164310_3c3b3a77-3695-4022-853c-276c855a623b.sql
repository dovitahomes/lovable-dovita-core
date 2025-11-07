-- ================================================================
-- BLOQUE 21: Phase 5 - Catálogos, Configuraciones y Alianzas
-- ================================================================

-- ============================================================
-- 1. CONTENIDO CORPORATIVO (logos, colores, info empresa)
-- ============================================================
ALTER TABLE public.contenido_corporativo ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_contenido_corporativo 
  ON public.contenido_corporativo
  FOR ALL
  USING (current_user_has_role('admin'));

-- Todos los colaboradores pueden ver
CREATE POLICY colaboradores_view_contenido_corporativo 
  ON public.contenido_corporativo
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'contenido_corporativo', 'view')
  );

-- Solo admin y herramientas pueden editar
CREATE POLICY herramientas_manage_contenido_corporativo 
  ON public.contenido_corporativo
  FOR UPDATE
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'herramientas', 'edit')
  )
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'herramientas', 'edit')
  );

-- ============================================================
-- 2. TU_NODES (Transacciones Unificadas - Catálogo jerárquico)
-- ============================================================
ALTER TABLE public.tu_nodes ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_tu_nodes 
  ON public.tu_nodes
  FOR ALL
  USING (current_user_has_role('admin'));

-- Todos los colaboradores pueden ver TU
CREATE POLICY colaboradores_view_tu_nodes 
  ON public.tu_nodes
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('colaborador', 'contador')
    )
  );

-- Solo admin puede crear/editar TU
CREATE POLICY admin_manage_tu_nodes 
  ON public.tu_nodes
  FOR INSERT
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY admin_update_tu_nodes 
  ON public.tu_nodes
  FOR UPDATE
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY admin_delete_tu_nodes 
  ON public.tu_nodes
  FOR DELETE
  USING (current_user_has_role('admin'));

-- ============================================================
-- 3. ALIANZAS
-- ============================================================
ALTER TABLE public.alianzas ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_alianzas 
  ON public.alianzas
  FOR ALL
  USING (current_user_has_role('admin'));

-- Usuarios con permiso de comisiones pueden ver
CREATE POLICY comisiones_view_alianzas 
  ON public.alianzas
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'view')
  );

-- Usuarios con permiso de comisiones pueden crear
CREATE POLICY comisiones_manage_alianzas 
  ON public.alianzas
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'create')
  );

-- Usuarios con permiso de comisiones pueden editar
CREATE POLICY comisiones_update_alianzas 
  ON public.alianzas
  FOR UPDATE
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'edit')
  )
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'edit')
  );

-- ============================================================
-- 4. BUSINESS_RULE_SETS
-- ============================================================
ALTER TABLE public.business_rule_sets ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_business_rule_sets 
  ON public.business_rule_sets
  FOR ALL
  USING (current_user_has_role('admin'));

-- Colaboradores pueden ver
CREATE POLICY colaboradores_view_business_rule_sets 
  ON public.business_rule_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'colaborador', 'contador')
    )
  );

-- ============================================================
-- 5. BUSINESS_RULES
-- ============================================================
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_business_rules 
  ON public.business_rules
  FOR ALL
  USING (current_user_has_role('admin'));

-- Colaboradores pueden ver reglas
CREATE POLICY colaboradores_view_business_rules 
  ON public.business_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'colaborador', 'contador')
    )
  );

-- ============================================================
-- 6. COMMISSION_CONFIG
-- ============================================================
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_commission_config 
  ON public.commission_config
  FOR ALL
  USING (current_user_has_role('admin'));

-- Usuarios con permiso de comisiones pueden ver
CREATE POLICY comisiones_view_commission_config 
  ON public.commission_config
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'view')
  );

-- Solo admin puede editar configuración de comisiones
CREATE POLICY admin_update_commission_config 
  ON public.commission_config
  FOR UPDATE
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

-- ============================================================
-- 7. COMMISSION_RULES
-- ============================================================
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_commission_rules 
  ON public.commission_rules
  FOR ALL
  USING (current_user_has_role('admin'));

-- Usuarios con permiso de comisiones pueden ver
CREATE POLICY comisiones_view_commission_rules 
  ON public.commission_rules
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'view')
  );

-- Usuarios con permiso de comisiones pueden crear
CREATE POLICY comisiones_manage_commission_rules 
  ON public.commission_rules
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'create')
  );

-- Usuarios con permiso de comisiones pueden editar
CREATE POLICY comisiones_update_commission_rules 
  ON public.commission_rules
  FOR UPDATE
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'edit')
  )
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'comisiones', 'edit')
  );

-- ============================================================
-- 8. CONSUMPTION_CONFIG
-- ============================================================
ALTER TABLE public.consumption_config ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_consumption_config 
  ON public.consumption_config
  FOR ALL
  USING (current_user_has_role('admin'));

-- Colaboradores pueden ver configuración de consumo
CREATE POLICY colaboradores_view_consumption_config 
  ON public.consumption_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'colaborador')
    )
  );

-- ============================================================
-- 9. FINANCE_CONFIG
-- ============================================================
ALTER TABLE public.finance_config ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_all_finance_config 
  ON public.finance_config
  FOR ALL
  USING (current_user_has_role('admin'));

-- Usuarios con permiso de finanzas pueden ver
CREATE POLICY finanzas_view_finance_config 
  ON public.finance_config
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'view')
  );

-- Solo admin puede editar configuración de finanzas
CREATE POLICY admin_update_finance_config 
  ON public.finance_config
  FOR UPDATE
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));