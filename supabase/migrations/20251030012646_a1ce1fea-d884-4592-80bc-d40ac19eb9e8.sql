-- Migración idempotente: Auth y permisos a prueba de balas
-- 1) Enum de roles (si no existe)
do $$ begin
  create type public.app_role as enum ('admin','colaborador','contador','cliente');
exception when duplicate_object then null; end $$;

-- 2) Tablas base
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

create table if not exists public.user_module_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_name text not null,
  can_view boolean default false,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, module_name)
);

-- 3) RLS habilitado
alter table public.user_roles enable row level security;
alter table public.user_module_permissions enable row level security;

-- 4) Políticas RLS
drop policy if exists "see own roles" on public.user_roles;
create policy "see own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "admins see roles" on public.user_roles;
create policy "admins see roles" on public.user_roles
for select to authenticated using (public.has_role(auth.uid(),'admin'::public.app_role));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(),'admin'::public.app_role))
with check (public.has_role(auth.uid(),'admin'::public.app_role));

drop policy if exists "see own perms" on public.user_module_permissions;
create policy "see own perms" on public.user_module_permissions
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "admins see perms" on public.user_module_permissions;
create policy "admins see perms" on public.user_module_permissions
for select to authenticated using (public.has_role(auth.uid(),'admin'::public.app_role));

drop policy if exists "admins manage perms" on public.user_module_permissions;
create policy "admins manage perms" on public.user_module_permissions
for all to authenticated
using (public.has_role(auth.uid(),'admin'::public.app_role))
with check (public.has_role(auth.uid(),'admin'::public.app_role));

-- 5) Función: sembrar permisos por rol (reemplazar)
create or replace function public.seed_permissions_for_role(p_user_id uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_role='admin' then
    insert into public.user_module_permissions(user_id,module_name,can_view,can_create,can_edit,can_delete) values
      (p_user_id,'dashboard',true,true,true,true),
      (p_user_id,'leads',true,true,true,true),
      (p_user_id,'clientes',true,true,true,true),
      (p_user_id,'proyectos',true,true,true,true),
      (p_user_id,'diseno',true,true,true,true),
      (p_user_id,'presupuestos',true,true,true,true),
      (p_user_id,'cronograma',true,true,true,true),
      (p_user_id,'construccion',true,true,true,true),
      (p_user_id,'proveedores',true,true,true,true),
      (p_user_id,'finanzas',true,true,true,true),
      (p_user_id,'contabilidad',true,true,true,true),
      (p_user_id,'comisiones',true,true,true,true),
      (p_user_id,'usuarios',true,true,true,true),
      (p_user_id,'herramientas',true,true,true,true)
    on conflict (user_id,module_name) do nothing;
  elsif p_role='colaborador' then
    insert into public.user_module_permissions(user_id,module_name,can_view,can_create,can_edit,can_delete) values
      (p_user_id,'dashboard',true,false,false,false),
      (p_user_id,'leads',true,true,true,false),
      (p_user_id,'clientes',true,true,true,false),
      (p_user_id,'proyectos',true,true,true,false),
      (p_user_id,'diseno',true,true,true,false),
      (p_user_id,'presupuestos',true,true,true,false),
      (p_user_id,'cronograma',true,true,true,false),
      (p_user_id,'construccion',true,true,true,false),
      (p_user_id,'proveedores',true,true,true,false)
    on conflict (user_id,module_name) do nothing;
  elsif p_role='contador' then
    insert into public.user_module_permissions(user_id,module_name,can_view,can_create,can_edit,can_delete) values
      (p_user_id,'dashboard',true,false,false,false),
      (p_user_id,'finanzas',true,true,true,false),
      (p_user_id,'contabilidad',true,true,true,false)
    on conflict (user_id,module_name) do nothing;
  elsif p_role='cliente' then
    insert into public.user_module_permissions(user_id,module_name,can_view,can_create,can_edit,can_delete) values
      (p_user_id,'client_portal',true,false,false,false)
    on conflict (user_id,module_name) do nothing;
  end if;
end $$;

-- 6) Trigger: sembrar permisos automáticamente al insertar un rol
create or replace function public.after_user_role_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.seed_permissions_for_role(new.user_id,new.role);
  return new;
end $$;

drop trigger if exists trg_after_user_role_insert on public.user_roles;
create trigger trg_after_user_role_insert
after insert on public.user_roles
for each row execute function public.after_user_role_insert();

-- 7) Bootstrap con primer admin automático (reemplazar)
create or replace function public.bootstrap_user_access(target_user_id uuid default auth.uid())
returns void language plpgsql security definer set search_path=public as $$
declare
  v_email text;
  v_full_name text;
  v_confirmed timestamptz;
  v_has_admin boolean;
  r record;
begin
  -- Permitir self-service o admin
  if target_user_id <> auth.uid() and not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Not authorized to bootstrap this user';
  end if;

  -- Datos de auth
  select au.email, au.email_confirmed_at, coalesce(au.raw_user_meta_data->>'full_name','')
  into v_email, v_confirmed, v_full_name
  from auth.users au
  where au.id = target_user_id;

  -- Validar email confirmado
  if v_confirmed is null then
    raise exception 'Email no confirmado';
  end if;

  -- Asegurar perfil
  insert into public.profiles (id, email, full_name)
  values (target_user_id, v_email, coalesce(v_full_name, ''))
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- ¿Existe algún admin?
  select exists(select 1 from public.user_roles where role='admin'::public.app_role) into v_has_admin;

  -- Si no hay admins → este usuario será admin
  if not v_has_admin then
    insert into public.user_roles(user_id, role)
    values (target_user_id, 'admin')
    on conflict do nothing;
  end if;

  -- Si no tiene ningún rol, asignar colaborador por defecto
  if not exists(select 1 from public.user_roles where user_id = target_user_id) then
    insert into public.user_roles(user_id, role)
    values (target_user_id, 'colaborador')
    on conflict do nothing;
  end if;

  -- Asignar rol cliente si el email existe en clients
  if exists (select 1 from public.clients c where c.email = v_email) then
    insert into public.user_roles(user_id, role)
    values (target_user_id, 'cliente')
    on conflict do nothing;
  end if;

  -- Sembrar permisos por cada rol (el trigger ya lo hace, pero por si acaso)
  for r in select role from public.user_roles where user_id = target_user_id loop
    perform public.seed_permissions_for_role(target_user_id, r.role);
  end loop;
end $$;

grant execute on function public.bootstrap_user_access(uuid) to authenticated;