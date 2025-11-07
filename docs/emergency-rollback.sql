-- =============================================
-- EMERGENCY ROLLBACK SCRIPT
-- Sistema de Roles, Permisos y RLS - Dovita Core
-- =============================================
-- IMPORTANTE: Este script deshabilita RLS de emergencia
-- Solo ejecutar en caso de problemas críticos de acceso
-- =============================================

-- FUNCIÓN DE ROLLBACK DE EMERGENCIA (GLOBAL)
-- Deshabilita RLS en todas las tablas críticas
CREATE OR REPLACE FUNCTION public.emergency_disable_all_rls()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_record RECORD;
  result_message text := '';
BEGIN
  -- Solo admin puede ejecutar
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden ejecutar rollback de emergencia';
  END IF;

  -- Deshabilitar RLS en todas las tablas críticas
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('roles', 'module_permissions')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_record.tablename);
    result_message := result_message || format('RLS deshabilitado en: %s; ', table_record.tablename);
  END LOOP;

  -- Log de auditoría
  INSERT INTO audit_rule_changes (rule_id, old_value_json, new_value_json, changed_by)
  VALUES (
    gen_random_uuid(),
    '{"action": "emergency_rollback"}'::jsonb,
    jsonb_build_object('timestamp', now(), 'tables_affected', result_message),
    auth.uid()
  );

  RETURN result_message;
END;
$$;

-- =============================================
-- ROLLBACK POR FASE
-- =============================================

-- ========================
-- ROLLBACK FASE 0 (Pre-Requisitos)
-- ========================
/*
-- Eliminar funciones creadas
DROP FUNCTION IF EXISTS public.admin_set_user_roles(uuid, text[]);
DROP FUNCTION IF EXISTS public.user_can_access_project(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_has_module_permission(uuid, text, text);
DROP FUNCTION IF EXISTS public.update_user_metadata_updated_at();

-- Eliminar tabla user_metadata
DROP TABLE IF EXISTS public.user_metadata CASCADE;

-- Limpiar permisos sembrados (PRECAUCIÓN: solo si hubo error)
-- DELETE FROM user_permissions WHERE created_at > '2025-01-07';
*/

-- ========================
-- ROLLBACK FASE 1 (RLS Tablas Críticas)
-- ========================
/*
-- Deshabilitar RLS en tablas financieras
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batch_items DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas creadas
DROP POLICY IF EXISTS "Admins can view all budgets" ON budgets;
DROP POLICY IF EXISTS "Collaborators can view project budgets" ON budgets;
DROP POLICY IF EXISTS "Clients can view own project budgets" ON budgets;
-- ... (agregar todas las políticas de Fase 1)

-- Eliminar vista cliente
DROP VIEW IF EXISTS public.v_budget_items_client;
*/

-- ========================
-- ROLLBACK FASE 2 (RLS Tablas Operativas)
-- ========================
/*
-- Deshabilitar RLS en tablas operativas
ALTER TABLE public.construction_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_consumption DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_change_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas creadas (agregar todas)
DROP POLICY IF EXISTS "Users can view construction stages for accessible projects" ON construction_stages;
-- ... (agregar todas las políticas de Fase 2)
*/

-- ========================
-- ROLLBACK FASE 3 (RLS Catálogos)
-- ========================
/*
-- Deshabilitar RLS en catálogos
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tu_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alianzas DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en configuraciones
ALTER TABLE public.pricing_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules DISABLE ROW LEVEL SECURITY;
*/

-- ========================
-- ROLLBACK FASE 4 (Auditoría y Frontend)
-- ========================
/*
-- Eliminar tabla de auditoría de roles
DROP TABLE IF EXISTS public.user_role_audit CASCADE;

-- Eliminar trigger de auditoría
DROP TRIGGER IF EXISTS audit_user_role_change ON user_roles;
DROP FUNCTION IF EXISTS public.audit_user_role_change();

-- Remover índices de performance RLS
DROP INDEX IF EXISTS idx_budgets_project_id;
DROP INDEX IF EXISTS idx_budget_items_budget_id;
DROP INDEX IF EXISTS idx_invoices_emisor_id;
-- ... (agregar todos los índices creados en Fase 4)
*/

-- =============================================
-- VERIFICACIÓN POST-ROLLBACK
-- =============================================
-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Verificar que no hay políticas activas
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
