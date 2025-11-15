-- Crear tabla para almacenar emails recibidos desde Mailchimp
CREATE TABLE IF NOT EXISTS public.mailchimp_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores de Mailchimp
  message_id TEXT NOT NULL UNIQUE,
  conversation_id TEXT,
  
  -- Información del email
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  
  -- Metadatos
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  
  -- Relación con CRM (opcional)
  lead_id UUID,
  
  -- Datos adicionales
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_mailchimp_emails_message_id ON public.mailchimp_emails(message_id);
CREATE INDEX idx_mailchimp_emails_from_email ON public.mailchimp_emails(from_email);
CREATE INDEX idx_mailchimp_emails_to_email ON public.mailchimp_emails(to_email);
CREATE INDEX idx_mailchimp_emails_received_at ON public.mailchimp_emails(received_at DESC);
CREATE INDEX idx_mailchimp_emails_read ON public.mailchimp_emails(read);
CREATE INDEX idx_mailchimp_emails_lead_id ON public.mailchimp_emails(lead_id);

-- Habilitar RLS
ALTER TABLE public.mailchimp_emails ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins pueden ver todos los emails"
  ON public.mailchimp_emails
  FOR SELECT
  USING (current_user_has_role('admin'));

CREATE POLICY "Colaboradores pueden ver emails de su módulo"
  ON public.mailchimp_emails
  FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY "Sistema puede insertar emails"
  ON public.mailchimp_emails
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar estados de email"
  ON public.mailchimp_emails
  FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_mailchimp_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mailchimp_emails_updated_at_trigger
BEFORE UPDATE ON public.mailchimp_emails
FOR EACH ROW
EXECUTE FUNCTION update_mailchimp_emails_updated_at();

-- Comentarios
COMMENT ON TABLE public.mailchimp_emails IS 'Almacena emails recibidos via webhook de Mailchimp';
COMMENT ON COLUMN public.mailchimp_emails.message_id IS 'ID único del mensaje en Mailchimp';
COMMENT ON COLUMN public.mailchimp_emails.conversation_id IS 'ID de la conversación en Mailchimp para agrupar emails relacionados';