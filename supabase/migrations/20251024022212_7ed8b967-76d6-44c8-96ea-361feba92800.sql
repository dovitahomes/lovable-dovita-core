-- Chat por proyecto
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendario de citas
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  attendees JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_project_messages_project ON public.project_messages(project_id);
CREATE INDEX idx_project_messages_created ON public.project_messages(created_at DESC);
CREATE INDEX idx_calendar_events_project ON public.calendar_events(project_id);
CREATE INDEX idx_calendar_events_dates ON public.calendar_events(start_at, end_at);

-- RLS para project_messages
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their projects"
  ON public.project_messages
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_messages.project_id
        AND pm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = project_messages.project_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their projects"
  ON public.project_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_messages.project_id
          AND pm.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.clients c ON c.id = p.client_id
        WHERE p.id = project_messages.project_id
          AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- RLS para calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events from their projects"
  ON public.calendar_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = calendar_events.project_id
        AND pm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = calendar_events.project_id
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) OR
    attendees::jsonb @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
  );

CREATE POLICY "Users can create events in their projects"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      project_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = calendar_events.project_id
          AND pm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update events they created"
  ON public.calendar_events
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete events they created"
  ON public.calendar_events
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    created_by = auth.uid()
  );