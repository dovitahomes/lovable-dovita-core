-- Create project_collaborators table for assigning team members to projects
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'colaborador', 'viewer')) DEFAULT 'colaborador' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Enable RLS (policies to be defined later)
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be implemented):
-- TODO: Collaborators can view their own assignments
-- TODO: Admins can manage all assignments
-- TODO: Clients cannot access this table

COMMENT ON TABLE public.project_collaborators IS 'Asignación de colaboradores a proyectos. RLS pendiente: colaboradores ven sus asignaciones, admins gestionan todas, clientes sin acceso.';

-- Ensure project_messages table exists (may already exist)
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on messages (policies to be defined later)
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be implemented):
-- TODO: Assigned collaborators can view/write messages for their projects
-- TODO: Clients can view messages for their own projects (filtered)
-- TODO: Consider adding 'visibility' field to filter internal vs client messages

COMMENT ON TABLE public.project_messages IS 'Mensajes de proyectos. RLS pendiente: colaboradores asignados leen/escriben, clientes ven solo mensajes de sus proyectos.';