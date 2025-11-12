-- ============================================
-- FASE 2: MEJORAS EN BASE DE DATOS - CONSTRUCCIÓN
-- Agregar columnas stage_id, categoria, metadata a construction_photos
-- Crear índices para queries rápidas
-- Actualizar vista v_client_photos
-- ============================================

-- 1. Agregar columnas a construction_photos
ALTER TABLE public.construction_photos 
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.construction_stages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS categoria TEXT CHECK (categoria IN (
  'cimentacion',
  'estructura',
  'albanileria',
  'instalaciones',
  'acabados',
  'exteriores',
  'otros'
)),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.construction_photos.stage_id IS 'Relación con etapa de construcción específica';
COMMENT ON COLUMN public.construction_photos.categoria IS 'Categoría de la foto: cimentacion, estructura, albanileria, instalaciones, acabados, exteriores, otros';
COMMENT ON COLUMN public.construction_photos.metadata IS 'Información adicional en formato JSON (clima, equipo usado, etc.)';
COMMENT ON COLUMN public.construction_photos.is_active IS 'Soft delete flag - false para fotos eliminadas';

-- 2. Crear índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_construction_photos_project_stage 
ON public.construction_photos(project_id, stage_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_construction_photos_fecha_desc 
ON public.construction_photos(project_id, fecha_foto DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_construction_photos_categoria 
ON public.construction_photos(categoria) 
WHERE is_active = true AND categoria IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_construction_photos_geolocation 
ON public.construction_photos(latitude, longitude) 
WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_construction_photos_stage_fecha 
ON public.construction_photos(stage_id, fecha_foto DESC) 
WHERE is_active = true AND stage_id IS NOT NULL;

-- 3. Recrear vista v_client_photos con nuevas columnas
DROP VIEW IF EXISTS public.v_client_photos CASCADE;

CREATE OR REPLACE VIEW public.v_client_photos AS
SELECT
  cp.id,
  cp.project_id,
  cp.file_url,
  cp.file_name,
  cp.descripcion,
  cp.latitude,
  cp.longitude,
  cp.fecha_foto,
  cp.categoria,
  cp.stage_id,
  cs.name AS stage_name,
  cp.metadata,
  cp.created_at,
  cp.uploaded_by
FROM public.construction_photos cp
LEFT JOIN public.construction_stages cs ON cp.stage_id = cs.id
WHERE cp.visibilidad = 'cliente' 
  AND cp.is_active = true;

COMMENT ON VIEW public.v_client_photos IS 'Vista de fotos de construcción visibles para clientes, incluye categoría y nombre de etapa';

-- Grant SELECT permissions on updated view
GRANT SELECT ON public.v_client_photos TO authenticated;

-- 4. Actualizar fotos existentes con valores por defecto
UPDATE public.construction_photos
SET categoria = 'otros'
WHERE categoria IS NULL AND is_active = true;

-- 5. Crear función helper para obtener fotos por categoría
CREATE OR REPLACE FUNCTION public.get_photos_by_category(
  p_project_id UUID,
  p_categoria TEXT DEFAULT NULL
)
RETURNS TABLE (
  photo_id UUID,
  file_url TEXT,
  descripcion TEXT,
  fecha_foto TIMESTAMPTZ,
  categoria TEXT,
  stage_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.file_url,
    cp.descripcion,
    cp.fecha_foto,
    cp.categoria,
    cs.name,
    cp.latitude,
    cp.longitude
  FROM public.construction_photos cp
  LEFT JOIN public.construction_stages cs ON cp.stage_id = cs.id
  WHERE cp.project_id = p_project_id
    AND cp.is_active = true
    AND (p_categoria IS NULL OR cp.categoria = p_categoria)
  ORDER BY cp.fecha_foto DESC;
END;
$$;

COMMENT ON FUNCTION public.get_photos_by_category IS 'Obtener fotos de construcción filtradas por proyecto y categoría opcional';

-- 6. Crear función helper para obtener fotos geolocalizadas
CREATE OR REPLACE FUNCTION public.get_geolocated_photos(
  p_project_id UUID
)
RETURNS TABLE (
  photo_id UUID,
  file_url TEXT,
  descripcion TEXT,
  fecha_foto TIMESTAMPTZ,
  categoria TEXT,
  stage_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.file_url,
    cp.descripcion,
    cp.fecha_foto,
    cp.categoria,
    cs.name,
    cp.latitude,
    cp.longitude,
    cp.metadata
  FROM public.construction_photos cp
  LEFT JOIN public.construction_stages cs ON cp.stage_id = cs.id
  WHERE cp.project_id = p_project_id
    AND cp.is_active = true
    AND cp.latitude IS NOT NULL
    AND cp.longitude IS NOT NULL
  ORDER BY cp.fecha_foto DESC;
END;
$$;

COMMENT ON FUNCTION public.get_geolocated_photos IS 'Obtener solo fotos con geolocalización para visualización en mapas';