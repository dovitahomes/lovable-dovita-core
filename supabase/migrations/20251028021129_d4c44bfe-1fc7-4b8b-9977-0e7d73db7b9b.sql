-- Create bucket for project documents
insert into storage.buckets (id, name, public) 
values ('project_docs', 'project_docs', false)
on conflict (id) do nothing;

-- Policy: authenticated users can read project_docs they have access to
create policy "auth_can_read_project_docs"
on storage.objects for select
using (
  bucket_id = 'project_docs' 
  and auth.role() = 'authenticated'
);

-- Policy: authenticated users can upload to their projects
create policy "auth_can_insert_project_docs"
on storage.objects for insert
with check (
  bucket_id = 'project_docs' 
  and auth.role() = 'authenticated'
);

-- Policy: users can delete files they own
create policy "owner_can_delete_project_docs"
on storage.objects for delete
using (
  bucket_id = 'project_docs' 
  and owner = auth.uid()
);