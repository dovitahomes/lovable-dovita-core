-- FASE 1: DESTRUCCIÓN TOTAL DEL SISTEMA VIEJO
BEGIN;

-- 1.1) Deshabilitar RLS en TODAS las tablas para evitar bloqueos
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END$$;

-- 1.2) Eliminar TODAS las policies de TODAS las tablas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- 1.3) Eliminar TODAS las funciones relacionadas con permisos
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.current_has_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.bootstrap_user() CASCADE;
DROP FUNCTION IF EXISTS public.bootstrap_user_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_user_roles(uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.set_user_roles(uuid, public.app_role[]) CASCADE;
DROP FUNCTION IF EXISTS public.seed_permissions_for_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.seed_permissions_for_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.after_user_role_insert() CASCADE;
DROP FUNCTION IF EXISTS public.grant_admin_if_whitelisted() CASCADE;
DROP FUNCTION IF EXISTS public.grant_admin_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.bootstrap_first_admin(text) CASCADE;
DROP FUNCTION IF EXISTS public.any_admin_exists() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_count() CASCADE;
DROP FUNCTION IF EXISTS public._has_any_admin() CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_users() CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_role(uuid, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_role(uuid, public.app_role, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_module_permission(uuid, text, boolean, boolean, boolean, boolean) CASCADE;

-- 1.4) Eliminar vistas
DROP VIEW IF EXISTS public.vw_users_basic CASCADE;
DROP VIEW IF EXISTS public.vw_users_with_roles CASCADE;

-- 1.5) Eliminar tablas de permisos
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.user_module_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles_catalog CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.admin_emails CASCADE;

-- 1.6) Eliminar ENUM si existe (forzado)
DROP TYPE IF EXISTS public.app_role CASCADE;

COMMIT;