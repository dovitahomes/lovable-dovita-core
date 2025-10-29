-- 1️⃣ Reemplazar función ensure_default_role() con versión correcta
create or replace function public.ensure_default_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Inserta el rol 'colaborador' directamente en user_roles usando el enum app_role
  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'colaborador'::public.app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.ensure_default_role() to authenticated;

-- 2️⃣ Asignar rol "colaborador" a usuarios existentes sin rol
insert into public.user_roles (user_id, role)
select id, 'colaborador'::public.app_role
from public.profiles p
where not exists (
  select 1 from public.user_roles ur where ur.user_id = p.id
);

-- 3️⃣ Habilitar RLS en todas las tablas críticas
do $$
declare
  tbl record;
begin
  for tbl in
    select table_name
    from information_schema.tables
    where table_schema='public'
      and table_type='BASE TABLE'
      and table_name in (
        'clients','projects','profiles','user_roles','providers','leads',
        'budgets','budget_items','documents','construction_photos',
        'purchase_orders','transactions','invoices','gantt_plans',
        'calendar_events','project_messages','project_members'
      )
  loop
    execute format('alter table public.%I enable row level security;', tbl.table_name);
  end loop;
end $$;