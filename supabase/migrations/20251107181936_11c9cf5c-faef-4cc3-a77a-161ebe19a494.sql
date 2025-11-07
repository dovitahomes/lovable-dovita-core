-- Drop existing views to recreate with correct column mappings
DROP VIEW IF EXISTS public.v_client_documents CASCADE;
DROP VIEW IF EXISTS public.v_client_photos CASCADE;

-- Create bucket for construction photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'construction-photos',
  'construction-photos',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for general documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create view for client documents (read-only)
-- Maps actual table columns to view columns
CREATE VIEW public.v_client_documents AS
SELECT 
  d.id,
  d.project_id,
  d.nombre,
  d.tipo_carpeta,
  d.etiqueta,
  d.file_url,
  d.file_type,
  d.file_size,
  d.firmado,
  d.created_at,
  d.updated_at
FROM public.documents d
WHERE d.visibilidad = 'cliente';

COMMENT ON VIEW public.v_client_documents IS 'Read-only view of documents visible to clients';

-- Create view for client construction photos (read-only)
CREATE VIEW public.v_client_photos AS
SELECT
  cp.id,
  cp.project_id,
  cp.file_url,
  cp.file_name,
  cp.descripcion,
  cp.latitude,
  cp.longitude,
  cp.fecha_foto,
  cp.created_at
FROM public.construction_photos cp
WHERE cp.visibilidad = 'cliente';

COMMENT ON VIEW public.v_client_photos IS 'Read-only view of construction photos visible to clients';

-- Grant SELECT permissions on views to authenticated users
GRANT SELECT ON public.v_client_documents TO authenticated;
GRANT SELECT ON public.v_client_photos TO authenticated;