-- ============================================
-- Corrección de Dependencia Circular en RLS
-- user_permissions policies
-- ============================================

-- PASO 1: Eliminar política problemática que causa ciclo
DROP POLICY IF EXISTS user_permissions_select_self_or_admin ON public.user_permissions;

-- PASO 2: Crear política para usuarios (leer sus propios permisos)
-- Esta política NO usa current_user_has_role(), solo auth.uid()
-- Esto rompe el ciclo de dependencias
CREATE POLICY "user_permissions_select_own"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- PASO 3: Crear política para admins (leer todos los permisos)
-- Usa EXISTS directo sin función helper para evitar ciclo
CREATE POLICY "user_permissions_select_all_admin"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);

-- Verificación: Mostrar políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  substring(qual::text, 1, 100) as policy_condition
FROM pg_policies 
WHERE tablename = 'user_permissions'
ORDER BY cmd, policyname;