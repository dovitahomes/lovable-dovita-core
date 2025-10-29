-- 1) Helper: ¿existe algún admin?
create or replace function public._has_any_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_roles where role = 'admin'::public.app_role
  );
$$;

-- 2) Conceder admin por email (bootstrap)
create or replace function public.grant_admin_by_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Permitir si: (a) quien llama es admin, o (b) aún no hay ningún admin (primer bootstrapping)
  if not public.has_role(auth.uid(), 'admin'::public.app_role) and public._has_any_admin() then
    raise exception 'Solo un admin puede otorgar rol admin';
  end if;

  select id into v_user_id from public.profiles where lower(email)=lower(p_email);
  if v_user_id is null then
    raise exception 'No existe profile con email %', p_email;
  end if;

  insert into public.user_roles(user_id, role)
  values (v_user_id, 'admin')
  on conflict do nothing;

  -- Semilla de permisos para ese rol (usa función existente)
  perform public.seed_permissions_for_role(v_user_id, 'admin'::public.app_role);
end;
$$;
grant execute on function public.grant_admin_by_email(text) to authenticated;

-- 3) Listar usuarios + roles (solo admin)
create or replace function public.admin_list_users()
returns table(
  user_id uuid,
  email text,
  full_name text,
  roles public.app_role[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'admin'::public.app_role) then
    raise exception 'Solo admin';
  end if;

  return query
    select p.id,
           p.email,
           p.full_name,
           coalesce(array_agg(ur.role order by ur.role)::public.app_role[], '{}')
    from public.profiles p
    left join public.user_roles ur on ur.user_id = p.id
    group by p.id, p.email, p.full_name
    order by p.email asc;
end;
$$;
grant execute on function public.admin_list_users() to authenticated;

-- 4) Asignar / quitar rol a un usuario (solo admin)
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'admin'::public.app_role) then
    raise exception 'Solo admin';
  end if;

  if p_enabled then
    insert into public.user_roles(user_id, role)
    values (p_user_id, p_role)
    on conflict do nothing;
    perform public.seed_permissions_for_role(p_user_id, p_role);
  else
    delete from public.user_roles where user_id = p_user_id and role = p_role;
    -- Nota: mantenemos permisos existentes por si el usuario tiene otros roles. La UI los re-sembrará si cambian.
  end if;
end;
$$;
grant execute on function public.admin_set_user_role(uuid, public.app_role, boolean) to authenticated;

-- 5) Establecer permisos por módulo (solo admin)
create or replace function public.admin_set_module_permission(
  p_user_id uuid,
  p_module text,
  p_can_view boolean,
  p_can_create boolean,
  p_can_edit boolean,
  p_can_delete boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'admin'::public.app_role) then
    raise exception 'Solo admin';
  end if;

  insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
  values (p_user_id, p_module, p_can_view, p_can_create, p_can_edit, p_can_delete)
  on conflict (user_id, module_name) do update
  set can_view = excluded.can_view,
      can_create = excluded.can_create,
      can_edit = excluded.can_edit,
      can_delete = excluded.can_delete,
      updated_at = now();
end;
$$;
grant execute on function public.admin_set_module_permission(uuid, text, boolean, boolean, boolean, boolean) to authenticated;

-- 6) Promover al admin inicial
select public.grant_admin_by_email('e@dovitahomes.com');