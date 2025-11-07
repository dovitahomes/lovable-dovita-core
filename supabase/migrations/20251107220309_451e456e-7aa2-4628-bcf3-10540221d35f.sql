-- ============================================
-- CORRECCIÓN DEFINITIVA: ELIMINAR POLÍTICAS RLS RECURSIVAS
-- ============================================
-- Este script elimina las políticas RLS que causan recursión infinita
-- en las tablas user_permissions y user_roles.
-- Mantiene solo las 4 políticas esenciales (authenticated SELECT + service_role CRUD)

-- 1. Eliminar políticas recursivas de user_permissions
DROP POLICY IF EXISTS "user_permissions_select_all_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_select_own" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_insert_by_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_update_by_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_delete_by_admin" ON public.user_permissions;

-- 2. Eliminar políticas recursivas de user_roles
DROP POLICY IF EXISTS "user_roles_select_all_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_self" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_by_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_by_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_by_admin" ON public.user_roles;

-- 3. Recargar schema cache para que PostgREST recoja los cambios
NOTIFY pgrst, 'reload schema';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Cada tabla (user_permissions y user_roles) debe tener SOLO 4 políticas:
-- 1. "Enable read access for all authenticated users" (SELECT, authenticated)
-- 2. "Enable insert for service role only" (INSERT, service_role)
-- 3. "Enable update for service role only" (UPDATE, service_role)
-- 4. "Enable delete for service role only" (DELETE, service_role)
--
-- Esto permite:
-- ✅ Los usuarios autenticados pueden LEER sus permisos/roles (necesario para el frontend)
-- ✅ Solo service_role puede ESCRIBIR (INSERT/UPDATE/DELETE)
-- ✅ Las funciones SECURITY DEFINER ejecutan como service_role, por lo que pueden escribir
-- ✅ No hay recursión porque no se usa EXISTS con current_user_has_role en las políticas
-- ✅ Admin fallback ya no es necesario porque la lectura siempre funciona