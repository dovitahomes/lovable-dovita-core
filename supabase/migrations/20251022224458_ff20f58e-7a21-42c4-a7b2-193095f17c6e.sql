-- Add missing columns to users table for complete user management
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id);

-- Create index for birthday lookups
CREATE INDEX IF NOT EXISTS idx_users_fecha_nacimiento ON public.users(fecha_nacimiento);

-- Create index for last login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at);

-- Add comment
COMMENT ON COLUMN public.users.fecha_nacimiento IS 'Birthday for celebration tracking';
COMMENT ON COLUMN public.users.last_login_at IS 'Track user last login for activity monitoring';