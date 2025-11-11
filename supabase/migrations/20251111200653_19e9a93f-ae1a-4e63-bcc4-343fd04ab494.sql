-- Crear tabla para credenciales biométricas (solo si no existe)
CREATE TABLE IF NOT EXISTS public.user_biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id 
  ON public.user_biometric_credentials(user_id);

-- Índice para búsquedas por credential_id
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id 
  ON public.user_biometric_credentials(credential_id);

-- RLS Policies
ALTER TABLE public.user_biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users pueden ver y gestionar solo sus propias credenciales
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_biometric_credentials' 
    AND policyname = 'users_manage_own_biometric_credentials'
  ) THEN
    CREATE POLICY "users_manage_own_biometric_credentials"
      ON public.user_biometric_credentials
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Admins pueden ver todas las credenciales (solo lectura para soporte)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_biometric_credentials' 
    AND policyname = 'admins_view_all_biometric_credentials'
  ) THEN
    CREATE POLICY "admins_view_all_biometric_credentials"
      ON public.user_biometric_credentials
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role_name = 'admin'
        )
      );
  END IF;
END $$;

-- Comentarios de documentación
COMMENT ON TABLE public.user_biometric_credentials IS 
  'Almacena credenciales WebAuthn para login con biométricos (huella dactilar, reconocimiento facial)';
COMMENT ON COLUMN public.user_biometric_credentials.credential_id IS 
  'ID único de la credencial WebAuthn generado por el dispositivo';
COMMENT ON COLUMN public.user_biometric_credentials.public_key IS 
  'Clave pública del dispositivo en formato base64';
COMMENT ON COLUMN public.user_biometric_credentials.device_name IS 
  'Nombre descriptivo del dispositivo (ej: "MacBook Pro de Juan")';