-- 1) Helper: ¿existe al menos un admin?
create or replace function public.any_admin_exists()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where role = 'admin'::public.app_role
  );
$$;

-- 2) Bootstrap primer admin: solo funciona si NO existen admins y el email coincide
create or replace function public.bootstrap_first_admin(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_hay_admin boolean;
begin
  select any_admin_exists() into v_hay_admin;
  if v_hay_admin then
    -- Ya hay admin → no hace nada
    return false;
  end if;

  -- Buscar usuario por email
  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No existe un usuario con ese email';
  end if;

  -- Conceder rol admin si aún no hay ninguno
  insert into public.user_roles(user_id, role)
  values (v_user_id, 'admin'::public.app_role)
  on conflict do nothing;

  -- Sembrar permisos para admin
  perform public.seed_permissions_for_role(v_user_id, 'admin'::public.app_role);

  return true;
end;
$$;

grant execute on function public.bootstrap_first_admin(text) to authenticated;

-- 3) Políticas RLS para profiles: admin ve todo, usuarios ven su propio perfil
drop policy if exists "admin_read_profiles" on public.profiles;
create policy "admin_read_profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "self_read_profile" on public.profiles;
create policy "self_read_profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());