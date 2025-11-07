-- Add needs_password_setup flag to user_metadata
ALTER TABLE user_metadata
ADD COLUMN IF NOT EXISTS needs_password_setup boolean DEFAULT false;

COMMENT ON COLUMN user_metadata.needs_password_setup IS 
'Flag para indicar si el usuario fue invitado y necesita configurar su contraseña';