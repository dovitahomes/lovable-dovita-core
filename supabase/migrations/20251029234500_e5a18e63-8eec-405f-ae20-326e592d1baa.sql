-- 1️⃣ Add created_by columns to clients, projects, and budgets
alter table public.clients add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.projects add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.budgets add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Create generic trigger function to auto-set created_by
create or replace function public._default_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

-- Create triggers for clients table
drop trigger if exists trg_set_created_by_clients on public.clients;
create trigger trg_set_created_by_clients
before insert on public.clients
for each row
execute function public._default_created_by();

-- Create triggers for projects table
drop trigger if exists trg_set_created_by_projects on public.projects;
create trigger trg_set_created_by_projects
before insert on public.projects
for each row
execute function public._default_created_by();

-- Create triggers for budgets table
drop trigger if exists trg_set_created_by_budgets on public.budgets;
create trigger trg_set_created_by_budgets
before insert on public.budgets
for each row
execute function public._default_created_by();

-- 2️⃣ RLS Policies for CLIENTS
alter table public.clients enable row level security;

-- Drop existing policies
drop policy if exists "Users can view clients" on public.clients;
drop policy if exists "select_own_or_all_clients" on public.clients;
drop policy if exists "insert_own_clients" on public.clients;
drop policy if exists "update_own_or_all_clients" on public.clients;
drop policy if exists "delete_own_or_all_clients" on public.clients;

-- SELECT: view own clients or all if admin
create policy "select_own_or_all_clients"
on public.clients for select
to authenticated
using (
  created_by = auth.uid() 
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- INSERT: colaboradores and admins can create
create policy "insert_own_clients"
on public.clients for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'colaborador'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- UPDATE: edit own or all if admin
create policy "update_own_or_all_clients"
on public.clients for update
to authenticated
using (
  created_by = auth.uid() 
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  created_by = auth.uid() 
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- DELETE: delete own or all if admin
create policy "delete_own_or_all_clients"
on public.clients for delete
to authenticated
using (
  created_by = auth.uid() 
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2️⃣ RLS Policies for PROJECTS
alter table public.projects enable row level security;

-- Drop existing policies
drop policy if exists "Users can view projects" on public.projects;
drop policy if exists "select_own_or_all_projects" on public.projects;
drop policy if exists "insert_own_projects" on public.projects;
drop policy if exists "update_own_or_all_projects" on public.projects;
drop policy if exists "delete_own_or_all_projects" on public.projects;

-- SELECT: view own projects, or all if admin/contador
create policy "select_own_or_all_projects"
on public.projects for select
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'contador'::public.app_role)
);

-- INSERT: colaboradores and admins can create
create policy "insert_own_projects"
on public.projects for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'colaborador'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- UPDATE: edit own or all if admin
create policy "update_own_or_all_projects"
on public.projects for update
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- DELETE: delete own or all if admin
create policy "delete_own_or_all_projects"
on public.projects for delete
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2️⃣ RLS Policies for BUDGETS
alter table public.budgets enable row level security;

-- Drop existing policies
drop policy if exists "Users can view budgets" on public.budgets;
drop policy if exists "select_own_or_all_budgets" on public.budgets;
drop policy if exists "insert_own_budgets" on public.budgets;
drop policy if exists "update_own_or_all_budgets" on public.budgets;
drop policy if exists "delete_own_or_all_budgets" on public.budgets;

-- SELECT: view own budgets, or all if admin/contador
create policy "select_own_or_all_budgets"
on public.budgets for select
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'contador'::public.app_role)
);

-- INSERT: colaboradores and admins can create
create policy "insert_own_budgets"
on public.budgets for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'colaborador'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- UPDATE: edit own or all if admin
create policy "update_own_or_all_budgets"
on public.budgets for update
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- DELETE: delete own or all if admin
create policy "delete_own_or_all_budgets"
on public.budgets for delete
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3️⃣ Grant permissions
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;