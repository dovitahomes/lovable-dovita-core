-- 1) Helper: función para insertar permisos según rol (reusada por trigger y backfill)
create or replace function public.seed_module_permissions_for(
  p_user_id uuid,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin: ve todo
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

  -- Colaborador: sin finanzas/contabilidad/comisiones/usuarios
  elsif p_role = 'colaborador' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'leads', true, true, true, true),
      (p_user_id, 'clientes', true, true, true, true),
      (p_user_id, 'proyectos', true, true, true, true),
      (p_user_id, 'diseno', true, true, true, true),
      (p_user_id, 'presupuestos', true, true, true, true),
      (p_user_id, 'cronograma', true, true, true, true),
      (p_user_id, 'construccion', true, true, true, true),
      (p_user_id, 'proveedores', true, true, true, false)
    on conflict (user_id, module_name) do nothing;

  -- Contador: sólo finanzas/contabilidad
  elsif p_role = 'contador' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'finanzas', true, true, true, true),
      (p_user_id, 'contabilidad', true, true, true, true)
    on conflict (user_id, module_name) do nothing;

  -- Cliente: sólo portal cliente (clave 'client_portal')
  elsif p_role = 'cliente' then
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values
      (p_user_id, 'client_portal', true, false, false, false)
    on conflict (user_id, module_name) do nothing;

  -- Fallback para 'user' u otros
  else
    insert into public.user_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    values (p_user_id, 'dashboard', true, false, false, false)
    on conflict (user_id, module_name) do nothing;
  end if;
end;
$$;

-- 2) Trigger: cuando se inserta un rol, sembrar permisos
create or replace function public.on_user_role_created_seed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_module_permissions_for(new.user_id, new.role);
  return new;
end;
$$;

drop trigger if exists trg_user_roles_seed on public.user_roles;

create trigger trg_user_roles_seed
after insert on public.user_roles
for each row
execute function public.on_user_role_created_seed();

-- 3) Backfill: para TODOS los roles ya existentes
do $$
declare r record;
begin
  for r in select user_id, role from public.user_roles loop
    perform public.seed_module_permissions_for(r.user_id, r.role);
  end loop;
end $$;
