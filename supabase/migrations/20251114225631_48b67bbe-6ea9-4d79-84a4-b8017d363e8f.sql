-- ============================================
-- Migration: Auth Hero Image Upload System
-- Crea bucket privado y tabla para gestionar
-- imágenes de fondo de la página de login
-- ============================================

-- 1. Crear bucket privado para imágenes auth
INSERT INTO storage.buckets (id, name, public)
VALUES ('auth-hero-images', 'auth-hero-images', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies para storage.objects (bucket auth-hero-images)
CREATE POLICY "Admins pueden subir imágenes auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'auth-hero-images' AND
  (SELECT current_user_has_role('admin'))
);

CREATE POLICY "Admins pueden eliminar imágenes auth"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'auth-hero-images' AND
  (SELECT current_user_has_role('admin'))
);

CREATE POLICY "Todos los autenticados pueden leer imágenes auth"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'auth-hero-images');

-- 3. Crear tabla auth_hero_images
CREATE TABLE auth_hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE auth_hero_images ENABLE ROW LEVEL SECURITY;

-- 5. Policies para auth_hero_images
CREATE POLICY "Admins pueden gestionar imágenes auth hero"
ON auth_hero_images FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

CREATE POLICY "Usuarios autenticados pueden ver imágenes auth hero"
ON auth_hero_images FOR SELECT
TO authenticated
USING (true);

-- 6. Trigger para updated_at
CREATE TRIGGER update_auth_hero_images_updated_at
  BEFORE UPDATE ON auth_hero_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Índices para performance
CREATE INDEX idx_auth_hero_images_active ON auth_hero_images(active);
CREATE INDEX idx_auth_hero_images_created_at ON auth_hero_images(created_at DESC);

-- 8. Comentario
COMMENT ON TABLE auth_hero_images IS 
'Gestiona las imágenes de fondo/hero para la página de login. Solo una puede estar activa a la vez.';