-- 1) Whitelist de administradores
create table if not exists public.admin_emails (
  email text primary key
);

insert into public.admin_emails(email)
values ('e@dovitahomes.com')
on conflict (email) do nothing;

-- 2) Vista de usuarios (para UI)
create or replace view public.vw_users_basic as
select 
  p.id,
  p.email,
  coalesce(p.full_name, '') as full_name,
  coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}') as roles
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id
group by p.id, p.email, p.full_name;

grant select on public.vw_users_basic to authenticated;

-- 3) RPC: si el email actual está en whitelist → asigna rol admin y siembra permisos
create or replace function public.grant_admin_if_whitelisted()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email
  from auth.users where id = auth.uid();

  if exists (select 1 from public.admin_emails where email = v_email) then
    insert into public.user_roles(user_id, role)
    values (auth.uid(), 'admin'::public.app_role)
    on conflict (user_id, role) do nothing;

    perform public.seed_permissions_for_role(auth.uid(), 'admin'::public.app_role);
  end if;
end;
$$;

grant execute on function public.grant_admin_if_whitelisted() to authenticated;

-- 4) RPC: set_user_roles (solo admin), borra permisos y resiembra según roles
create or replace function public.set_user_roles(p_user_id uuid, p_roles public.app_role[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.app_role;
begin
  -- Solo admin puede usar esto
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Solo administradores';
  end if;

  -- Reset de roles y permisos
  delete from public.user_roles where user_id = p_user_id;
  delete from public.user_module_permissions where user_id = p_user_id;

  -- Reasignar roles y sembrar permisos por rol
  foreach r in array p_roles loop
    insert into public.user_roles(user_id, role) values (p_user_id, r)
    on conflict do nothing;

    perform public.seed_permissions_for_role(p_user_id, r);
  end loop;
end;
$$;