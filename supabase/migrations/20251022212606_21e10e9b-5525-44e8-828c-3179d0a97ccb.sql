-- Add more fields to leads table
ALTER TABLE public.leads 
  ADD COLUMN nombre_completo TEXT,
  ADD COLUMN telefono TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN estado TEXT,
  ADD COLUMN direccion TEXT,
  ADD COLUMN origen_lead TEXT[], -- Multiple sources
  ADD COLUMN terreno_m2 NUMERIC,
  ADD COLUMN presupuesto_referencia NUMERIC,
  ADD COLUMN ubicacion_terreno_json JSONB;

-- Create wishlist table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  payload JSONB NOT NULL, -- All questionnaire data
  firma_tipo TEXT CHECK (firma_tipo IN ('manuscrita', 'pdf')),
  firma_url TEXT,
  firmado BOOLEAN NOT NULL DEFAULT false,
  firmado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Add trigger for wishlists updated_at
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('firmas', 'firmas', false);

-- Create index
CREATE INDEX idx_wishlists_project ON public.wishlists(project_id);
CREATE INDEX idx_wishlists_firmado ON public.wishlists(firmado);