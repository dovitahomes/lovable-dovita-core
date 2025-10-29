-- ============================================
-- FASE 1: LIMPIEZA TOTAL
-- ============================================

-- Eliminar triggers
drop trigger if exists trg_user_roles_seed on public.user_roles;
drop trigger if exists trg_after_user_role_insert on public.user_roles;

-- Eliminar funciones
drop function if exists public.ensure_default_role() cascade;
drop function if exists public.ensure_default_role_by(uuid,public.app_role) cascade;
drop function if exists public.seed_module_permissions_for(uuid,public.app_role) cascade;
drop function if exists public.on_user_role_created_seed() cascade;
drop function if exists public.ensure_profile_by(uuid,text,text) cascade;
drop function if exists public.admin_ensure_user_bootstrap(uuid) cascade;
drop function if exists public.after_user_role_insert() cascade;
drop function if exists public.seed_permissions_for_role(uuid,public.app_role) cascade;
drop function if exists public.assign_role(uuid,public.app_role) cascade;

-- Eliminar políticas
drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Users can view own permissions" on public.user_module_permissions;
drop policy if exists "Admins can view all permissions" on public.user_module_permissions;
drop policy if exists "Users can see their own roles" on public.user_roles;
drop policy if exists "Admins can see all roles" on public.user_roles;
drop policy if exists "Users can see their own permissions" on public.user_module_permissions;
drop policy if exists "Admins can see all permissions" on public.user_module_permissions;

-- Eliminar tablas
drop table if exists public.user_module_permissions cascade;
drop table if exists public.user_roles cascade;

-- Mantener el enum app_role (si existe, no hacer nada; si no existe, se creará en FASE 2)