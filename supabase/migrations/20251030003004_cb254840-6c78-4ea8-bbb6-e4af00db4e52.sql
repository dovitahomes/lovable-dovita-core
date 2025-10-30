-- Función para contar administradores (segura para frontend)
create or replace function public.get_admin_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  select count(*) into n
  from public.user_roles
  where role = 'admin'::public.app_role;
  return n;
end;
$$;
grant execute on function public.get_admin_count() to authenticated;

-- Bootstrap del primer admin: si no hay ninguno, convierte al usuario actual en admin
create or replace function public.bootstrap_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'No authenticated user';
  end if;

  select public.get_admin_count() into n;

  if n = 0 then
    insert into public.user_roles(user_id, role)
    values (me, 'admin'::public.app_role)
    on conflict do nothing;

    -- Sembrar permisos de admin (reutilizando función de siembra por rol)
    perform public.seed_permissions_for_role(me, 'admin'::public.app_role);
  end if;
end;
$$;
grant execute on function public.bootstrap_first_admin() to authenticated;