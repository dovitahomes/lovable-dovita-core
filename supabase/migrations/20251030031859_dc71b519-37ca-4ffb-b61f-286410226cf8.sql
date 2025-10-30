-- FASE 3: RLS Y SEGURIDAD
BEGIN;

-- 3.1) RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_self_or_admin"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.current_user_has_role('admin')
);

CREATE POLICY "user_roles_insert_admin_only"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.current_user_has_role('admin'));

CREATE POLICY "user_roles_delete_admin_only"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.current_user_has_role('admin'));

-- 3.2) RLS en user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_permissions_select_self_or_admin"
ON public.user_permissions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.current_user_has_role('admin')
);

CREATE POLICY "user_permissions_all_admin_only"
ON public.user_permissions FOR ALL
TO authenticated
USING (public.current_user_has_role('admin'))
WITH CHECK (public.current_user_has_role('admin'));

-- 3.3) RLS en profiles (ya debería existir, reforzar)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.current_user_has_role('admin')
);

CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.current_user_has_role('admin')
)
WITH CHECK (
  id = auth.uid()
  OR public.current_user_has_role('admin')
);

CREATE POLICY "profiles_insert_self_or_admin"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  OR public.current_user_has_role('admin')
);

-- 3.4) Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.roles TO authenticated, service_role;
GRANT ALL ON TABLE public.user_roles TO authenticated, service_role;
GRANT ALL ON TABLE public.user_permissions TO authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO authenticated, service_role;
GRANT ALL ON FUNCTION public.user_has_role(UUID, TEXT) TO authenticated, service_role;
GRANT ALL ON FUNCTION public.current_user_has_role(TEXT) TO authenticated, service_role;
GRANT ALL ON FUNCTION public.seed_role_permissions(UUID, TEXT) TO authenticated, service_role;
GRANT ALL ON FUNCTION public.bootstrap_user_on_login() TO authenticated, service_role;
GRANT ALL ON FUNCTION public.admin_set_user_roles(UUID, TEXT[]) TO authenticated, service_role;

COMMIT;