-- ============================================
-- CORRECCIÓN DEFINITIVA: Eliminar Ciclo Infinito en RLS
-- ============================================

-- ============================================
-- BLOQUE 1: Limpiar user_roles policies
-- ============================================

-- Eliminar políticas con current_user_has_role
DROP POLICY IF EXISTS user_roles_insert_admin_only ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete_admin_only ON public.user_roles;

-- Crear políticas con EXISTS directo
CREATE POLICY "user_roles_insert_by_admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);

CREATE POLICY "user_roles_delete_by_admin"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);

-- ============================================
-- BLOQUE 2: Limpiar user_permissions policies
-- ============================================

-- Eliminar política ALL que causa ciclo
DROP POLICY IF EXISTS user_permissions_all_admin_only ON public.user_permissions;

-- Crear políticas granulares con EXISTS directo
CREATE POLICY "user_permissions_insert_by_admin"
ON public.user_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);

CREATE POLICY "user_permissions_update_by_admin"
ON public.user_permissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);

CREATE POLICY "user_permissions_delete_by_admin"
ON public.user_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role_name = 'admin'
  )
);