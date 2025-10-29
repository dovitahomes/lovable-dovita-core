-- 1) Función parametrizada: asegura profile sin depender de auth.uid()
create or replace function public.ensure_profile_by(
  p_user_id uuid,
  p_email text,
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'ensure_profile_by: p_user_id is required';
  end if;

  insert into public.profiles (id, email, full_name)
  values (p_user_id, p_email, coalesce(p_full_name, ''))
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
end;
$$;

grant execute on function public.ensure_profile_by(uuid,text,text) to authenticated;

-- 2) Función parametrizada: asegura rol por defecto para un user_id dado
create or replace function public.ensure_default_role_by(
  p_user_id uuid,
  p_role public.app_role default 'colaborador'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'ensure_default_role_by: p_user_id is required';
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.ensure_default_role_by(uuid,public.app_role) to authenticated;

-- 3) RPC principal: bootstrap de un usuario (self-service + admin)
-- Hace profile, rol por defecto y permisos por rol (semilla)
create or replace function public.admin_ensure_user_bootstrap(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
  v_is_admin boolean;
  r record;
begin
  if target_user_id is null then
    raise exception 'admin_ensure_user_bootstrap: target_user_id is required';
  end if;

  -- permitir si el llamante es admin o el propio usuario (self)
  v_is_admin := coalesce(has_role(auth.uid(), 'admin'::public.app_role), false);
  if not v_is_admin and auth.uid() <> target_user_id then
    raise exception 'Not authorized to bootstrap this user';
  end if;

  select au.email, coalesce(au.raw_user_meta_data->>'full_name','')
  into v_email, v_full_name
  from auth.users au
  where au.id = target_user_id;

  -- 3.1 profile
  perform public.ensure_profile_by(target_user_id, v_email, v_full_name);

  -- 3.2 rol por defecto (colaborador) si no existe
  perform public.ensure_default_role_by(target_user_id, 'colaborador');

  -- 3.3 rol 'cliente' si el email aparece en clients
  if exists (select 1 from public.clients c where c.email = v_email) then
    perform public.ensure_default_role_by(target_user_id, 'cliente');
  end if;

  -- 3.4 sembrar permisos por cada rol del usuario
  for r in
    select role from public.user_roles where user_id = target_user_id
  loop
    perform public.seed_module_permissions_for(target_user_id, r.role);
  end loop;
end;
$$;

grant execute on function public.admin_ensure_user_bootstrap(uuid) to authenticated;

-- 4) (idempotente) Backfill para todos los usuarios existentes
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
    perform public.ensure_profile_by(user_rec.user_id, user_rec.email, user_rec.full_name);
    
    -- rol colaborador si no tiene alguno
    if not exists (select 1 from public.user_roles ur where ur.user_id = user_rec.user_id) then
      perform public.ensure_default_role_by(user_rec.user_id, 'colaborador');
    end if;

    -- rol cliente si existe en clients.email
    if exists (select 1 from public.clients c where c.email = user_rec.email) then
      perform public.ensure_default_role_by(user_rec.user_id, 'cliente');
    end if;

    -- sembrar permisos por cada rol
    for role_rec in
      select role from public.user_roles where user_id = user_rec.user_id
    loop
      perform public.seed_module_permissions_for(user_rec.user_id, role_rec.role);
    end loop;
  end loop;
end $$;