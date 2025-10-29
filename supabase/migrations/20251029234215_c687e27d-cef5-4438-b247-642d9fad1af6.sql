-- 1️⃣ Add created_by column to leads table
alter table public.leads 
add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Create trigger function to auto-set created_by
create or replace function public._force_created_by()
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

-- Create trigger on leads table
drop trigger if exists trg_set_created_by on public.leads;
create trigger trg_set_created_by
before insert on public.leads
for each row
execute function public._force_created_by();

-- 2️⃣ Enable RLS if not already enabled
alter table public.leads enable row level security;

-- Drop existing policies
drop policy if exists "Staff can view leads" on public.leads;
drop policy if exists "select_own_or_all_leads" on public.leads;
drop policy if exists "insert_own_leads" on public.leads;
drop policy if exists "update_own_or_all_leads" on public.leads;
drop policy if exists "delete_own_or_all_leads" on public.leads;

-- 🔍 SELECT: view leads created by you or if you're admin
create policy "select_own_or_all_leads"
on public.leads
for select
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ✏️ INSERT: allow creating leads (created_by set automatically by trigger)
create policy "insert_own_leads"
on public.leads
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.has_role(auth.uid(), 'colaborador'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- 🔄 UPDATE: allow editing only your own leads or if you're admin
create policy "update_own_or_all_leads"
on public.leads
for update
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 🗑️ DELETE: allow deleting only your own leads or if you're admin
create policy "delete_own_or_all_leads"
on public.leads
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3️⃣ Grant explicit permissions
grant select, insert, update, delete on public.leads to authenticated;