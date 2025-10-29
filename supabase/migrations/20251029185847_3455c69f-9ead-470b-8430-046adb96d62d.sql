-- A) Ensure profile exists for current user
create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), '')
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;

-- B) Ensure default role "colaborador" for current user
create or replace function public.ensure_default_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'colaborador'::app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.ensure_default_role() to authenticated;