-- FASE 4.1: Crear tabla notifications con RLS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS: Admins pueden ver todas las notificaciones
CREATE POLICY "admin_all_notifications"
  ON public.notifications
  FOR ALL
  USING (current_user_has_role('admin'));

-- RLS: Usuarios ven solo sus notificaciones
CREATE POLICY "users_view_own_notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS: Sistema puede crear notificaciones
CREATE POLICY "system_insert_notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- RLS: Usuarios pueden marcar como leídas sus propias notificaciones
CREATE POLICY "users_update_own_notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;