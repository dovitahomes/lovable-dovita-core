-- ============================================
-- FASE 2: CREACIÓN CORRECTA DE ESTRUCTURA
-- ============================================

-- 1️⃣ Enum de roles (crear solo si no existe)
do $$ begin
  create type public.app_role as enum ('admin','colaborador','contador','cliente');
exception
  when duplicate_object then null;
end $$;

-- 2️⃣ Tabla principal de roles de usuario
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

-- 3️⃣ Tabla de permisos por módulo
create table public.user_module_permissions (
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

-- 4️⃣ Habilitar RLS y políticas seguras
alter table public.user_roles enable row level security;
alter table public.user_module_permissions enable row level security;

-- Políticas usando has_role() para evitar recursión
create policy "Users can see their own roles"
  on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Admins can see all roles"
  on public.user_roles
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Users can see their own permissions"
  on public.user_module_permissions
  for select using (auth.uid() = user_id);

create policy "Admins can see all permissions"
  on public.user_module_permissions
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- FASE 3: SISTEMA AUTOMÁTICO DE PERMISOS
-- ============================================

-- 1️⃣ Semilla de permisos base por rol
create or replace function public.seed_permissions_for_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role = 'admin' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'dashboard', true, true, true, true),
      (p_user_id, 'leads', true, true, true, true),
      (p_user_id, 'clientes', true, true, true, true),
      (p_user_id, 'proyectos', true, true, true, true),
      (p_user_id, 'diseno', true, true, true, true),
      (p_user_id, 'presupuestos', true, true, true, true),
      (p_user_id, 'cronograma', true, true, true, true),
      (p_user_id, 'construccion', true, true, true, true),
      (p_user_id, 'proveedores', true, true, true, true),
      (p_user_id, 'finanzas', true, true, true, true),
      (p_user_id, 'contabilidad', true, true, true, true),
      (p_user_id, 'comisiones', true, true, true, true),
      (p_user_id, 'usuarios', true, true, true, true),
      (p_user_id, 'herramientas', true, true, true, true)
    on conflict (user_id, module_name) do nothing;
    
  elsif p_role = 'colaborador' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'leads', true, true, true, false),
      (p_user_id, 'clientes', true, true, true, false),
      (p_user_id, 'proyectos', true, true, true, false),
      (p_user_id, 'diseno', true, true, true, false),
      (p_user_id, 'presupuestos', true, true, true, false),
      (p_user_id, 'cronograma', true, true, true, false),
      (p_user_id, 'construccion', true, true, true, false),
      (p_user_id, 'proveedores', true, true, true, false)
    on conflict (user_id, module_name) do nothing;
    
  elsif p_role = 'contador' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'finanzas', true, true, true, false),
      (p_user_id, 'contabilidad', true, true, true, false)
    on conflict (user_id, module_name) do nothing;
    
  elsif p_role = 'cliente' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values (p_user_id, 'client_portal', true, false, false, false)
    on conflict (user_id, module_name) do nothing;
  end if;
end;
$$;

grant execute on function public.seed_permissions_for_role(uuid, public.app_role) to authenticated;

-- 2️⃣ Trigger automático cuando se inserta un nuevo rol
create or replace function public.after_user_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_permissions_for_role(new.user_id, new.role);
  return new;
end;
$$;

create trigger trg_after_user_role_insert
  after insert on public.user_roles
  for each row
  execute function public.after_user_role_insert();

-- 3️⃣ Función de bootstrap para usuarios (self-service)
create or replace function public.bootstrap_user_access(target_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
  r record;
begin
  -- Permitir self-service (usuario sobre sí mismo) o admin
  if target_user_id <> auth.uid() and not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Not authorized to bootstrap this user';
  end if;

  -- Obtener datos del usuario
  select au.email, coalesce(au.raw_user_meta_data->>'full_name','')
  into v_email, v_full_name
  from auth.users au
  where au.id = target_user_id;

  -- Asegurar perfil
  insert into public.profiles (id, email, full_name)
  values (target_user_id, v_email, coalesce(v_full_name, ''))
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- Asignar rol colaborador si no tiene ningún rol
  if not exists (select 1 from public.user_roles where user_id = target_user_id) then
    insert into public.user_roles (user_id, role)
    values (target_user_id, 'colaborador')
    on conflict do nothing;
  end if;

  -- Asignar rol cliente si el email existe en clients
  if exists (select 1 from public.clients c where c.email = v_email) then
    insert into public.user_roles (user_id, role)
    values (target_user_id, 'cliente')
    on conflict do nothing;
  end if;

  -- Sembrar permisos por cada rol (el trigger ya lo hace, pero por si acaso)
  for r in select role from public.user_roles where user_id = target_user_id loop
    perform public.seed_permissions_for_role(target_user_id, r.role);
  end loop;
end;
$$;

grant execute on function public.bootstrap_user_access(uuid) to authenticated;

-- 4️⃣ Backfill para usuarios existentes
do $$
declare
  user_rec record;
  role_rec record;
begin
  for user_rec in
    select au.id as user_id,
           au.email as email,
           coalesce(au.raw_user_meta_data->>'full_name','') as full_name
    from auth.users au
  loop
    -- Profile
    insert into public.profiles (id, email, full_name)
    values (user_rec.user_id, user_rec.email, user_rec.full_name)
    on conflict (id) do update
      set email = coalesce(excluded.email, public.profiles.email),
          full_name = coalesce(excluded.full_name, public.profiles.full_name);
    
    -- Rol colaborador si no tiene ninguno
    if not exists (select 1 from public.user_roles ur where ur.user_id = user_rec.user_id) then
      insert into public.user_roles (user_id, role)
      values (user_rec.user_id, 'colaborador')
      on conflict do nothing;
    end if;

    -- Rol cliente si existe en clients.email
    if exists (select 1 from public.clients c where c.email = user_rec.email) then
      insert into public.user_roles (user_id, role)
      values (user_rec.user_id, 'cliente')
      on conflict do nothing;
    end if;

    -- Sembrar permisos por cada rol
    for role_rec in
      select role from public.user_roles where user_id = user_rec.user_id
    loop
      perform public.seed_permissions_for_role(user_rec.user_id, role_rec.role);
    end loop;
  end loop;
end $$;