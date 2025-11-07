-- Create project_events table for managing appointments between clients and collaborators
CREATE TABLE IF NOT EXISTS public.project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('propuesta', 'aceptada', 'rechazada', 'cancelada')) DEFAULT 'propuesta' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS (policies to be defined later)
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be implemented):
-- TODO: Clients can view/edit events for their own projects
-- TODO: Assigned collaborators can create/accept/reject events for their projects
-- TODO: Other users cannot access events

COMMENT ON TABLE public.project_events IS 'Eventos/citas de proyectos. RLS pendiente: clientes ven/editan eventos de sus proyectos, colaboradores asignados crean/gestionan eventos, otros sin acceso.';

-- Create view for client app consumption
CREATE OR REPLACE VIEW public.v_client_events AS
SELECT 
  e.id,
  e.project_id,
  e.title,
  e.description,
  e.start_time,
  e.end_time,
  e.status,
  e.created_by,
  e.created_at,
  p.full_name as created_by_name
FROM public.project_events e
LEFT JOIN public.profiles p ON p.id = e.created_by;

COMMENT ON VIEW public.v_client_events IS 'Vista para consumir eventos de proyectos con datos del creador.';

-- Enable realtime for project_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_events;