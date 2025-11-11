-- =====================================================
-- Migración: Agregar updated_by a tabla leads
-- Descripción: Agrega columna updated_by y trigger automático
-- Fecha: 2025-11-11
-- =====================================================

-- 1. Agregar columna updated_by si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    
    COMMENT ON COLUMN public.leads.updated_by IS 'Usuario que realizó la última actualización del lead';
  END IF;
END $$;

-- 2. Crear función trigger genérica para updated_by (si no existe)
CREATE OR REPLACE FUNCTION public.handle_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION public.handle_updated_by() IS 'Función trigger que actualiza automáticamente updated_by y updated_at';

-- 3. Crear trigger en leads (drop primero si existe)
DROP TRIGGER IF EXISTS set_updated_by_on_leads ON public.leads;

CREATE TRIGGER set_updated_by_on_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_by();

COMMENT ON TRIGGER set_updated_by_on_leads ON public.leads IS 'Actualiza automáticamente updated_by y updated_at en cada modificación';