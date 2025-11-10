-- Agregar columna project_name a tabla projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN public.projects.project_name IS 
  'Nombre personalizado del proyecto (ej: "Casa en la Colina", "Residencia Familiar García")';

-- Generar nombres automáticos para proyectos existentes
UPDATE public.projects
SET project_name = 'Proyecto ' || SUBSTRING(id::text, 1, 8)
WHERE project_name IS NULL;

-- Actualizar vista v_client_projects para usar project_name
CREATE OR REPLACE VIEW public.v_client_projects AS
SELECT
  p.id            AS project_id,
  p.client_id     AS client_id,
  'PRJ-' || SUBSTRING(p.id::text, 1, 8) AS project_code,
  COALESCE(
    p.project_name,
    'Casa ' || c.name,
    'Proyecto sin nombre'
  ) AS project_name,
  COALESCE(p.status::text, 'activo') AS status,
  p.created_at,
  p.ubicacion_json,
  p.terreno_m2
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id;