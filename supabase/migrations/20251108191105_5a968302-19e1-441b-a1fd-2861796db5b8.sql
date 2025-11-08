-- Create required_documents table
CREATE TABLE public.required_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  fase TEXT NOT NULL CHECK (fase IN ('arquitectonico', 'ejecutivo', 'construccion')),
  documento_tipo TEXT NOT NULL,
  obligatorio BOOLEAN NOT NULL DEFAULT true,
  subido BOOLEAN NOT NULL DEFAULT false,
  document_id UUID,
  fecha_subida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "admin_all_required_documents" 
ON public.required_documents 
FOR ALL 
USING (current_user_has_role('admin'));

CREATE POLICY "collaborator_view_required_documents" 
ON public.required_documents 
FOR SELECT 
USING (
  user_can_access_project(auth.uid(), project_id) 
  AND user_has_module_permission(auth.uid(), 'diseno', 'view')
);

CREATE POLICY "collaborator_manage_required_documents" 
ON public.required_documents 
FOR INSERT 
WITH CHECK (
  user_can_access_project(auth.uid(), project_id) 
  AND user_has_module_permission(auth.uid(), 'diseno', 'create')
);

CREATE POLICY "collaborator_update_required_documents" 
ON public.required_documents 
FOR UPDATE 
USING (
  user_can_access_project(auth.uid(), project_id) 
  AND user_has_module_permission(auth.uid(), 'diseno', 'edit')
)
WITH CHECK (
  user_can_access_project(auth.uid(), project_id) 
  AND user_has_module_permission(auth.uid(), 'diseno', 'edit')
);

CREATE POLICY "client_view_required_documents" 
ON public.required_documents 
FOR SELECT 
USING (user_can_access_project(auth.uid(), project_id));

-- Index for performance
CREATE INDEX idx_required_documents_project_id ON public.required_documents(project_id);
CREATE INDEX idx_required_documents_fase ON public.required_documents(fase);

-- Trigger function to auto-generate checklist on project creation
CREATE OR REPLACE FUNCTION public.generate_required_documents_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Arquitectónico
  INSERT INTO public.required_documents (project_id, fase, documento_tipo, obligatorio)
  VALUES
    (NEW.id, 'arquitectonico', 'Planos Arquitectónicos', true),
    (NEW.id, 'arquitectonico', 'Renders 3D', false),
    (NEW.id, 'arquitectonico', 'Especificaciones de Acabados', true),
    (NEW.id, 'arquitectonico', 'Reglamento de Construcción', true),
    (NEW.id, 'arquitectonico', 'Licencias y Permisos', true);
  
  -- Ejecutivo
  INSERT INTO public.required_documents (project_id, fase, documento_tipo, obligatorio)
  VALUES
    (NEW.id, 'ejecutivo', 'Planos Estructurales', true),
    (NEW.id, 'ejecutivo', 'Planos Eléctricos', true),
    (NEW.id, 'ejecutivo', 'Planos Hidráulicos', true),
    (NEW.id, 'ejecutivo', 'Planos Sanitarios', true),
    (NEW.id, 'ejecutivo', 'Cálculos Estructurales', true),
    (NEW.id, 'ejecutivo', 'Memoria de Cálculo', false);
  
  -- Construcción
  INSERT INTO public.required_documents (project_id, fase, documento_tipo, obligatorio)
  VALUES
    (NEW.id, 'construccion', 'Bitácora de Obra', true),
    (NEW.id, 'construccion', 'Números Generadores', true),
    (NEW.id, 'construccion', 'Estimaciones', false),
    (NEW.id, 'construccion', 'Reporte Fotográfico', false),
    (NEW.id, 'construccion', 'Actas de Entrega', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate on project creation
CREATE TRIGGER trigger_generate_required_documents
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_required_documents_checklist();

-- Trigger to update updated_at
CREATE TRIGGER update_required_documents_updated_at
  BEFORE UPDATE ON public.required_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();