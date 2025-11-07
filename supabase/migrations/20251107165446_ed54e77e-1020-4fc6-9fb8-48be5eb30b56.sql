-- ============================================
-- MIGRACIÓN: Eliminar tablas deprecadas y migrar datos
-- Descripción: Agregar campos faltantes a profiles, migrar datos de users, y eliminar tablas deprecadas
-- ============================================

-- PASO 1: Agregar campos faltantes a la tabla profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES sucursales(id);

-- PASO 2: Migrar datos de users a profiles (solo si hay coincidencia por email)
-- Esta migración actualiza los campos en profiles si encuentra un registro en users con el mismo email
UPDATE profiles p
SET 
  fecha_nacimiento = u.fecha_nacimiento,
  last_login_at = u.last_login_at,
  sucursal_id = u.sucursal_id
FROM users u
WHERE p.email = u.email
  AND (u.fecha_nacimiento IS NOT NULL 
       OR u.last_login_at IS NOT NULL 
       OR u.sucursal_id IS NOT NULL);

-- PASO 3: Eliminar tablas deprecadas
-- Primero verificar que no hay foreign keys apuntando a estas tablas
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- PASO 4: Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_fecha_nacimiento ON profiles(fecha_nacimiento) WHERE fecha_nacimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_sucursal_id ON profiles(sucursal_id) WHERE sucursal_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN profiles.fecha_nacimiento IS 'Fecha de nacimiento del usuario';
COMMENT ON COLUMN profiles.last_login_at IS 'Última vez que el usuario inició sesión';
COMMENT ON COLUMN profiles.sucursal_id IS 'Sucursal a la que pertenece el usuario';