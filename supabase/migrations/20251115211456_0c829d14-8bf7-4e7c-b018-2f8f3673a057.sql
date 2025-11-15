-- FASE 1: Tablas email_config y mailchimp_seats

-- Enum para proveedores de email
CREATE TYPE email_provider AS ENUM ('mailchimp', 'resend', 'none');

-- Enum para tipos de asiento Mailchimp
CREATE TYPE mailchimp_seat_type AS ENUM ('generic', 'user');

-- Tabla de configuración global de email (single-row)
CREATE TABLE public.email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor email_provider NOT NULL DEFAULT 'none',
  
  -- Configuración Mailchimp
  mailchimp_api_key TEXT,
  mailchimp_server_prefix TEXT,
  mailchimp_default_list_id TEXT,
  mailchimp_total_seats INTEGER DEFAULT 0,
  mailchimp_generic_email TEXT,
  
  -- Configuración Resend
  resend_api_key TEXT,
  resend_from_domain TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solo permitir una fila en email_config
CREATE UNIQUE INDEX email_config_singleton ON public.email_config ((TRUE));

-- Insertar configuración por defecto
INSERT INTO public.email_config (proveedor) VALUES ('none');

-- Tabla de asientos Mailchimp
CREATE TABLE public.mailchimp_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mailchimp_email TEXT NOT NULL,
  seat_type mailchimp_seat_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  mailchimp_member_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Constraints: Solo un asiento genérico activo
CREATE UNIQUE INDEX mailchimp_seats_generic_unique 
ON public.mailchimp_seats (seat_type, is_active) 
WHERE seat_type = 'generic' AND is_active = true;

-- Constraints: Usuario solo puede tener un asiento activo
CREATE UNIQUE INDEX mailchimp_seats_user_unique 
ON public.mailchimp_seats (user_id, is_active) 
WHERE user_id IS NOT NULL AND is_active = true;

-- Trigger para validar límite de asientos
CREATE OR REPLACE FUNCTION validate_mailchimp_seat_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_total_seats INTEGER;
  v_active_seats INTEGER;
BEGIN
  -- Obtener límite configurado
  SELECT mailchimp_total_seats INTO v_total_seats
  FROM public.email_config
  LIMIT 1;
  
  -- Contar asientos activos
  SELECT COUNT(*) INTO v_active_seats
  FROM public.mailchimp_seats
  WHERE is_active = true;
  
  -- Validar límite
  IF v_active_seats >= v_total_seats THEN
    RAISE EXCEPTION 'Se ha alcanzado el límite de asientos Mailchimp (% de %)', v_active_seats, v_total_seats;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_mailchimp_seat_limit
BEFORE INSERT ON public.mailchimp_seats
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION validate_mailchimp_seat_limit();

-- Trigger para updated_at
CREATE TRIGGER update_email_config_updated_at
BEFORE UPDATE ON public.email_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mailchimp_seats_updated_at
BEFORE UPDATE ON public.mailchimp_seats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para email_config
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_email_config"
ON public.email_config
FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

CREATE POLICY "colaboradores_view_email_config"
ON public.email_config
FOR SELECT
TO authenticated
USING (
  current_user_has_role('admin') OR 
  user_has_module_permission(auth.uid(), 'herramientas', 'view')
);

-- RLS Policies para mailchimp_seats
ALTER TABLE public.mailchimp_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mailchimp_seats"
ON public.mailchimp_seats
FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

CREATE POLICY "user_view_own_mailchimp_seat"
ON public.mailchimp_seats
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR current_user_has_role('admin'));