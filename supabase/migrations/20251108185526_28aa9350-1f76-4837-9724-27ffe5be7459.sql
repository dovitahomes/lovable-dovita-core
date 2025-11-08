-- FASE 2: Finanzas - CFDI Completo
-- Migrar xml_url a xml_path, agregar pdf_path y cfdi_metadata

-- 1. Renombrar xml_url a xml_path (mantener datos existentes)
ALTER TABLE public.invoices 
RENAME COLUMN xml_url TO xml_path;

-- 2. Agregar columna pdf_path
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- 3. Agregar columna cfdi_metadata para metadatos extraídos
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS cfdi_metadata JSONB;

-- 4. Notificar a PostgREST para recargar schema
NOTIFY pgrst, 'reload schema';