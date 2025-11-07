-- Crear bucket de avatars (público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para avatars: usuarios autenticados pueden subir/actualizar su propio avatar
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (
     SELECT 1 FROM public.user_roles 
     WHERE user_id = auth.uid() AND role_name = 'admin'
   ))
);

-- Avatars son públicos para lectura
CREATE POLICY "Avatars son públicos para lectura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Usuarios pueden actualizar su avatar
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (
     SELECT 1 FROM public.user_roles 
     WHERE user_id = auth.uid() AND role_name = 'admin'
   ))
);

-- Usuarios pueden borrar su avatar
CREATE POLICY "Usuarios pueden borrar su avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (
     SELECT 1 FROM public.user_roles 
     WHERE user_id = auth.uid() AND role_name = 'admin'
   ))
);