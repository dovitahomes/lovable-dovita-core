-- Crear función wrapper que acepta los parámetros como los envía el FE
create or replace function public.admin_set_user_roles(roles text[], target_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.admin_set_user_roles(target_user_id, roles);
$$;

-- Otorgar permisos a authenticated
grant execute on function public.admin_set_user_roles(text[], uuid) to authenticated;

-- Refrescar el schema cache de PostgREST
notify pgrst, 'reload schema';