-- ============================================
-- 1️⃣ Reemplazar función has_role() para evitar recursión
-- ============================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists(
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
end;
$$;

-- ============================================
-- 2️⃣ Reescribir policies en user_roles sin llamar has_role()
-- ============================================
drop policy if exists "see own roles" on public.user_roles;
drop policy if exists "admins see roles" on public.user_roles;
drop policy if exists "admins manage roles" on public.user_roles;

create policy "see own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "admins see roles"
on public.user_roles
for select
to authenticated
using (
  exists(
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::public.app_role
  )
);

create policy "admins manage roles"
on public.user_roles
for all
to authenticated
using (
  exists(
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::public.app_role
  )
)
with check (
  exists(
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::public.app_role
  )
);

-- ============================================
-- 3️⃣ Crear o insertar en admin_emails (whitelist)
-- ============================================
create table if not exists public.admin_emails (email text primary key);
insert into public.admin_emails(email)
values ('e@dovitahomes.com')
on conflict do nothing;

-- ============================================
-- 4️⃣ Sembrar primer admin (si no existe)
-- ============================================
do $$
declare
  v_first_user_id uuid;
  v_email text;
  v_has_admin boolean;
begin
  select exists(select 1 from public.user_roles where role = 'admin')
  into v_has_admin;

  if not v_has_admin then
    select id, email
    into v_first_user_id, v_email
    from auth.users
    where lower(email) = lower('e@dovitahomes.com')
      and email_confirmed_at is not null
    limit 1;

    if v_first_user_id is not null then
      insert into public.user_roles(user_id, role)
      values (v_first_user_id, 'admin')
      on conflict do nothing;

      perform public.seed_permissions_for_role(v_first_user_id, 'admin');
      raise notice '✅ Primer admin creado: %', v_email;
    end if;
  end if;
end $$;