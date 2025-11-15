-- Crear tabla para almacenar métricas de campañas Mailchimp
CREATE TABLE IF NOT EXISTS public.mailchimp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  email_from TEXT NOT NULL,
  email_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_mailchimp_campaigns_campaign_id ON public.mailchimp_campaigns(campaign_id);
CREATE INDEX idx_mailchimp_campaigns_email_to ON public.mailchimp_campaigns(email_to);
CREATE INDEX idx_mailchimp_campaigns_sent_at ON public.mailchimp_campaigns(sent_at);

-- Habilitar RLS
ALTER TABLE public.mailchimp_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies para métricas
CREATE POLICY "Admins pueden ver todas las métricas"
  ON public.mailchimp_campaigns
  FOR SELECT
  USING (current_user_has_role('admin'));

CREATE POLICY "Sistema puede insertar métricas"
  ON public.mailchimp_campaigns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema puede actualizar métricas"
  ON public.mailchimp_campaigns
  FOR UPDATE
  USING (true);

-- Comentarios
COMMENT ON TABLE public.mailchimp_campaigns IS 'Almacena métricas de campañas enviadas via Mailchimp';
COMMENT ON COLUMN public.mailchimp_campaigns.campaign_id IS 'ID de la campaña en Mailchimp';
COMMENT ON COLUMN public.mailchimp_campaigns.last_synced_at IS 'Última vez que se sincronizaron las métricas desde Mailchimp';