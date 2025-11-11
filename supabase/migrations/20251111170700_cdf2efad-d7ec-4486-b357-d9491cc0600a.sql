-- =====================================================
-- FASE 1: CORREGIR RLS - user_roles y user_permissions
-- Solo admins pueden ver estructura completa, usuarios ven solo permisos propios
-- =====================================================

-- =====================================================
-- CORREGIR RLS: user_roles solo para admins
-- =====================================================

-- Eliminar política permisiva actual si existe
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Solo admins pueden leer todos los roles
CREATE POLICY "admin_read_all_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name = 'admin'
  )
);

COMMENT ON POLICY "admin_read_all_user_roles" ON user_roles 
IS 'Solo administradores pueden ver roles de todos los usuarios. Usuarios regulares no tienen acceso a esta tabla.';

-- =====================================================
-- CORREGIR RLS: user_permissions solo admins + propios
-- =====================================================

-- Eliminar política permisiva actual si existe
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;

-- Admins pueden leer todos los permisos
CREATE POLICY "admin_read_all_user_permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name = 'admin'
  )
);

-- Usuarios pueden leer SOLO sus propios permisos (crítico para useModuleAccess)
CREATE POLICY "users_read_own_permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

COMMENT ON POLICY "admin_read_all_user_permissions" ON user_permissions 
IS 'Solo administradores pueden ver permisos de otros usuarios';

COMMENT ON POLICY "users_read_own_permissions" ON user_permissions 
IS 'Cada usuario puede ver sus propios permisos (requerido por useModuleAccess hook)';

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS
-- =====================================================

-- Verificar que las políticas se crearon correctamente
DO $$
BEGIN
  -- Verificar user_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'admin_read_all_user_roles'
  ) THEN
    RAISE EXCEPTION 'Política admin_read_all_user_roles no se creó correctamente';
  END IF;

  -- Verificar user_permissions admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_permissions' 
    AND policyname = 'admin_read_all_user_permissions'
  ) THEN
    RAISE EXCEPTION 'Política admin_read_all_user_permissions no se creó correctamente';
  END IF;

  -- Verificar user_permissions usuarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_permissions' 
    AND policyname = 'users_read_own_permissions'
  ) THEN
    RAISE EXCEPTION 'Política users_read_own_permissions no se creó correctamente';
  END IF;

  RAISE NOTICE 'FASE 1 COMPLETADA: Políticas RLS de user_roles y user_permissions actualizadas correctamente';
END $$;