-- ============================================
-- PASO 3: Completar perfil del admin
-- ============================================

-- Actualizar nombre completo del usuario admin
UPDATE profiles 
SET full_name = 'Administrador Dovita'
WHERE email = 'e@dovitahomes.com' AND full_name IS NULL;

-- Comentario de verificación
COMMENT ON COLUMN profiles.full_name IS 'Nombre completo del usuario - requerido para UX';
