-- =============================================
-- FASE 0 REFORZADA - Días 2-3
-- Sistema de Auditoría + Rollback de Emergencia
-- =============================================

-- ========================
-- DÍA 2: SISTEMA DE AUDITORÍA
-- ========================

-- Tabla de auditoría para cambios de roles
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('add_role', 'remove_role', 'bulk_update')),
  old_roles text[],
  new_roles text[],
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_role_audit_user_id ON user_role_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_audit_changed_by ON user_role_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_user_role_audit_created_at ON user_role_audit(created_at DESC);

-- Enable RLS (sin políticas por ahora)
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Función trigger para auditar cambios de roles
CREATE OR REPLACE FUNCTION public.audit_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_roles_array text[];
  new_roles_array text[];
BEGIN
  -- Obtener roles anteriores
  SELECT ARRAY_AGG(role_name) INTO old_roles_array
  FROM user_roles
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Determinar acción y roles nuevos
  IF TG_OP = 'INSERT' THEN
    new_roles_array := old_roles_array || ARRAY[NEW.role_name];
    
    INSERT INTO user_role_audit (
      user_id, action, old_roles, new_roles, changed_by, ip_address
    ) VALUES (
      NEW.user_id,
      'add_role',
      COALESCE(old_roles_array, ARRAY[]::text[]),
      new_roles_array,
      auth.uid(),
      inet_client_addr()
    );
  ELSIF TG_OP = 'DELETE' THEN
    new_roles_array := ARRAY_REMOVE(old_roles_array, OLD.role_name);
    
    INSERT INTO user_role_audit (
      user_id, action, old_roles, new_roles, changed_by, ip_address
    ) VALUES (
      OLD.user_id,
      'remove_role',
      old_roles_array,
      COALESCE(new_roles_array, ARRAY[]::text[]),
      auth.uid(),
      inet_client_addr()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para auditar cambios en user_roles
DROP TRIGGER IF EXISTS trigger_audit_user_role_change ON user_roles;
CREATE TRIGGER trigger_audit_user_role_change
  AFTER INSERT OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_role_change();

-- ========================
-- DÍA 3: ROLLBACK DE EMERGENCIA
-- ========================

-- Función de rollback de emergencia (ya creada en Pre-Requisitos, pero mejorada)
CREATE OR REPLACE FUNCTION public.emergency_disable_all_rls()
RETURNS TABLE (
  table_name text,
  rls_disabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_record RECORD;
BEGIN
  -- Solo admin puede ejecutar
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden ejecutar rollback de emergencia';
  END IF;

  -- Registrar en auditoría
  INSERT INTO user_role_audit (
    user_id, action, old_roles, new_roles, changed_by
  ) VALUES (
    auth.uid(),
    'bulk_update',
    ARRAY['emergency_rollback_started'],
    ARRAY['rls_disabled_globally'],
    auth.uid()
  );

  -- Deshabilitar RLS en todas las tablas públicas
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT IN ('roles', 'module_permissions') -- Excluir tablas críticas
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_record.tablename);
      
      RETURN QUERY SELECT 
        table_record.tablename::text,
        true;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        table_record.tablename::text,
        false;
    END;
  END LOOP;

  RETURN;
END;
$$;

-- ========================
-- DÍA 4: PROTECCIÓN DE COLUMNAS SENSIBLES
-- ========================

-- Vista filtrada para clientes (sin columnas sensibles)
CREATE OR REPLACE VIEW public.v_budget_items_client AS
SELECT 
  bi.id,
  bi.budget_id,
  bi.mayor_id,
  bi.partida_id,
  bi.subpartida_id,
  bi.descripcion,
  bi.unidad,
  bi.cant_real,
  bi.cant_necesaria,
  -- Columnas sensibles OCULTAS:
  -- bi.desperdicio_pct (oculto)
  -- bi.costo_unit (oculto)
  -- bi.honorarios_pct (oculto)
  -- bi.proveedor_alias (oculto)
  -- bi.provider_id (oculto)
  bi.precio_unit, -- Solo precio final
  bi.total,
  bi.order_index,
  bi.created_at,
  -- Join con TU para nombres legibles
  m.name as mayor_name,
  p.name as partida_name,
  s.name as subpartida_name
FROM budget_items bi
LEFT JOIN tu_nodes m ON bi.mayor_id = m.id
LEFT JOIN tu_nodes p ON bi.partida_id = p.id
LEFT JOIN tu_nodes s ON bi.subpartida_id = s.id;

-- Comentario explicativo
COMMENT ON VIEW v_budget_items_client IS 'Vista de items de presupuesto SIN columnas sensibles (costo, desperdicio, honorarios, proveedor). Para uso en cliente app.';

-- Función helper mejorada para verificar si usuario es cliente
CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'cliente'
  );
$$;

-- Grant permisos en vista
GRANT SELECT ON v_budget_items_client TO authenticated;

-- ========================
-- ÍNDICES ADICIONALES PARA PERFORMANCE RLS
-- ========================

-- Índices que se usarán en políticas RLS (preparación para Fase 1)
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON user_roles(user_id, role_name);

-- Comentarios para documentación
COMMENT ON TABLE user_role_audit IS 'Auditoría de todos los cambios de roles de usuarios. Registra quién cambió qué, cuándo y desde dónde.';
COMMENT ON FUNCTION emergency_disable_all_rls IS 'Función de emergencia para deshabilitar RLS globalmente. SOLO para casos críticos. Requiere rol admin.';
COMMENT ON FUNCTION is_client_user IS 'Verifica si el usuario autenticado tiene rol de cliente.';