-- FASE 1: Sistema de Chat con Gestión de Participantes

-- 1.1 Agregar asesor de ventas a proyectos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS sales_advisor_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_projects_sales_advisor 
ON public.projects(sales_advisor_id);

COMMENT ON COLUMN public.projects.sales_advisor_id IS 
'Usuario que es el asesor de ventas del proyecto. Debe estar presente de inicio a fin, participando en todas las fases y dando seguimiento con el cliente.';

-- 1.2 Crear tabla de participantes del chat
CREATE TABLE IF NOT EXISTS public.project_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('client', 'sales_advisor', 'collaborator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  show_history_from TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_project 
ON public.project_chat_participants(project_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user 
ON public.project_chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_active 
ON public.project_chat_participants(project_id, is_active);

-- RLS para project_chat_participants
ALTER TABLE public.project_chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_chat_participants ON public.project_chat_participants
FOR ALL USING (current_user_has_role('admin'));

CREATE POLICY collaborator_view_chat_participants ON public.project_chat_participants
FOR SELECT USING (
  user_can_access_project(auth.uid(), project_id)
);

CREATE POLICY collaborator_manage_chat_participants ON public.project_chat_participants
FOR INSERT WITH CHECK (
  user_can_access_project(auth.uid(), project_id) 
  AND user_has_module_permission(auth.uid(), 'proyectos', 'edit')
);

CREATE POLICY collaborator_update_chat_participants ON public.project_chat_participants
FOR UPDATE USING (
  user_can_access_project(auth.uid(), project_id)
  AND user_has_module_permission(auth.uid(), 'proyectos', 'edit')
);

-- 1.3 Trigger: Al crear proyecto, añadir cliente y asesor al chat
CREATE OR REPLACE FUNCTION public.auto_add_project_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Añadir cliente al chat (ve todo el historial)
  INSERT INTO public.project_chat_participants (
    project_id, user_id, participant_type, show_history_from
  )
  SELECT 
    NEW.id, 
    au.id, 
    'client', 
    NULL
  FROM public.clients c
  JOIN auth.users au ON au.email = c.email
  WHERE c.id = NEW.client_id
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  -- Añadir asesor de ventas al chat (ve todo el historial)
  IF NEW.sales_advisor_id IS NOT NULL THEN
    INSERT INTO public.project_chat_participants (
      project_id, user_id, participant_type, show_history_from
    ) VALUES (
      NEW.id,
      NEW.sales_advisor_id,
      'sales_advisor',
      NULL
    )
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_project_created_add_chat_participants ON public.projects;
CREATE TRIGGER on_project_created_add_chat_participants
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.auto_add_project_chat_participants();

-- 1.4 Trigger: Al añadir colaborador, añadirlo al chat
CREATE OR REPLACE FUNCTION public.auto_add_collaborator_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_chat_participants (
    project_id, 
    user_id, 
    participant_type, 
    show_history_from
  ) VALUES (
    NEW.project_id,
    NEW.user_id,
    'collaborator',
    now()
  )
  ON CONFLICT (project_id, user_id) DO UPDATE
  SET is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_collaborator_added_join_chat ON public.project_collaborators;
CREATE TRIGGER on_collaborator_added_join_chat
AFTER INSERT ON public.project_collaborators
FOR EACH ROW EXECUTE FUNCTION public.auto_add_collaborator_to_chat();

-- 1.5 Funciones de gestión
CREATE OR REPLACE FUNCTION public.grant_full_chat_history(
  p_project_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.project_chat_participants
  SET show_history_from = NULL
  WHERE project_id = p_project_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.remove_from_chat(
  p_project_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.project_chat_participants
  SET is_active = false
  WHERE project_id = p_project_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FASE 4: Migración de datos existentes

-- Migrar colaboradores existentes
INSERT INTO public.project_chat_participants (
  project_id,
  user_id,
  participant_type,
  show_history_from,
  joined_at
)
SELECT 
  pc.project_id,
  pc.user_id,
  'collaborator',
  NULL,
  pc.created_at
FROM public.project_collaborators pc
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Migrar clientes existentes
INSERT INTO public.project_chat_participants (
  project_id,
  user_id,
  participant_type,
  show_history_from,
  joined_at
)
SELECT 
  p.id as project_id,
  au.id as user_id,
  'client',
  NULL,
  p.created_at
FROM public.projects p
JOIN public.clients c ON c.id = p.client_id
JOIN auth.users au ON au.email = c.email
ON CONFLICT (project_id, user_id) DO NOTHING;