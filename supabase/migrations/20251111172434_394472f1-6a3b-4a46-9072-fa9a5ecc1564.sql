-- =====================================================
-- CORRECCIÓN QUIRÚRGICA: Eliminar recursión RLS
-- =====================================================
-- Usa current_user_has_role() SECURITY DEFINER para
-- evitar recursión infinita al leer user_roles desde
-- las políticas de user_roles y user_permissions

-- 1. Corregir política de user_roles
DROP POLICY IF EXISTS "admin_read_all_user_roles" ON user_roles;

CREATE POLICY "admin_read_all_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (public.current_user_has_role('admin'));

COMMENT ON POLICY "admin_read_all_user_roles" ON user_roles 
IS 'Solo admins leen todos los roles. Usa current_user_has_role() SECURITY DEFINER para evitar recursión RLS.';

-- 2. Corregir política de user_permissions
DROP POLICY IF EXISTS "admin_read_all_user_permissions" ON user_permissions;

CREATE POLICY "admin_read_all_user_permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (public.current_user_has_role('admin'));

COMMENT ON POLICY "admin_read_all_user_permissions" ON user_permissions 
IS 'Admins leen todos los permisos. Usa current_user_has_role() SECURITY DEFINER para evitar recursión RLS.';

-- La política users_read_own_permissions ya está correcta (NO causa recursión)
-- USING (user_id = auth.uid()) ✓ No accede a user_roles

-- Verificación: Las políticas ahora usan la función SECURITY DEFINER
-- que bypasea RLS y accede directamente a user_roles sin recursión