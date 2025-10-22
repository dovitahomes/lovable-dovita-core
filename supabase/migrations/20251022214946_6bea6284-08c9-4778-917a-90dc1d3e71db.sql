-- Create enums for purchase orders
CREATE TYPE purchase_order_status AS ENUM ('solicitado', 'ordenado', 'recibido');
CREATE TYPE equipment_type AS ENUM ('propia', 'rentada');

-- Create consumption config table
CREATE TABLE public.consumption_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  near_completion_threshold_pct NUMERIC NOT NULL DEFAULT 80.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.consumption_config (near_completion_threshold_pct) VALUES (80.0);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subpartida_id UUID NOT NULL REFERENCES public.tu_nodes(id),
  proveedor_id UUID REFERENCES public.providers(id),
  qty_solicitada NUMERIC NOT NULL,
  qty_ordenada NUMERIC DEFAULT 0,
  qty_recibida NUMERIC DEFAULT 0,
  estado purchase_order_status NOT NULL DEFAULT 'solicitado',
  fecha_requerida DATE,
  eta_proveedor DATE,
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create construction_photos table
CREATE TABLE public.construction_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  fecha_foto TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  descripcion TEXT,
  visibilidad TEXT NOT NULL CHECK (visibilidad IN ('interno', 'cliente')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_crew table (cuadrillas)
CREATE TABLE public.project_crew (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  especialidad TEXT,
  contacto_json JSONB,
  numero_personas INTEGER,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_subcontractors table
CREATE TABLE public.project_subcontractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  especialidad TEXT,
  contacto_json JSONB,
  costo_aproximado NUMERIC,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_equipment table
CREATE TABLE public.project_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo equipment_type NOT NULL,
  descripcion TEXT,
  costo_renta_diario NUMERIC,
  proveedor_id UUID REFERENCES public.providers(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_purchase_orders_project ON public.purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_subpartida ON public.purchase_orders(subpartida_id);
CREATE INDEX idx_purchase_orders_estado ON public.purchase_orders(estado);
CREATE INDEX idx_construction_photos_project ON public.construction_photos(project_id);
CREATE INDEX idx_project_crew_project ON public.project_crew(project_id);
CREATE INDEX idx_project_subcontractors_project ON public.project_subcontractors(project_id);
CREATE INDEX idx_project_equipment_project ON public.project_equipment(project_id);

-- Enable RLS
ALTER TABLE public.consumption_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view consumption config" ON public.consumption_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage consumption config" ON public.consumption_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update purchase orders" ON public.purchase_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete purchase orders" ON public.purchase_orders FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view construction photos" ON public.construction_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert construction photos" ON public.construction_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update construction photos" ON public.construction_photos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete construction photos" ON public.construction_photos FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view project crew" ON public.project_crew FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project crew" ON public.project_crew FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view project subcontractors" ON public.project_subcontractors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project subcontractors" ON public.project_subcontractors FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view project equipment" ON public.project_equipment FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project equipment" ON public.project_equipment FOR ALL USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_crew_updated_at BEFORE UPDATE ON public.project_crew FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_subcontractors_updated_at BEFORE UPDATE ON public.project_subcontractors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_equipment_updated_at BEFORE UPDATE ON public.project_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check consumption percentage
CREATE OR REPLACE FUNCTION public.get_subpartida_consumption(
  p_project_id UUID,
  p_subpartida_id UUID
)
RETURNS TABLE(
  qty_budgeted NUMERIC,
  qty_requested NUMERIC,
  qty_ordered NUMERIC,
  qty_received NUMERIC,
  consumption_pct NUMERIC,
  near_limit BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_threshold NUMERIC;
BEGIN
  -- Get threshold
  SELECT near_completion_threshold_pct INTO v_threshold FROM public.consumption_config LIMIT 1;
  
  RETURN QUERY
  WITH budget_qty AS (
    SELECT COALESCE(SUM(bi.cant_necesaria), 0) as total
    FROM public.budget_items bi
    JOIN public.budgets b ON b.id = bi.budget_id
    WHERE b.project_id = p_project_id
      AND bi.subpartida_id = p_subpartida_id
      AND b.type = 'ejecutivo'
      AND b.status = 'publicado'
  ),
  po_summary AS (
    SELECT
      COALESCE(SUM(qty_solicitada), 0) as requested,
      COALESCE(SUM(qty_ordenada), 0) as ordered,
      COALESCE(SUM(qty_recibida), 0) as received
    FROM public.purchase_orders
    WHERE project_id = p_project_id
      AND subpartida_id = p_subpartida_id
  )
  SELECT
    bq.total,
    ps.requested,
    ps.ordered,
    ps.received,
    CASE 
      WHEN bq.total > 0 THEN (ps.requested / bq.total * 100)
      ELSE 0
    END as consumption_pct,
    CASE 
      WHEN bq.total > 0 THEN (ps.requested / bq.total * 100) >= v_threshold
      ELSE false
    END as near_limit
  FROM budget_qty bq, po_summary ps;
END;
$$;