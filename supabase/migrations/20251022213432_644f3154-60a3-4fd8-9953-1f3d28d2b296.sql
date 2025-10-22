-- Create enum for budget type
CREATE TYPE public.budget_type AS ENUM ('parametrico', 'ejecutivo');

-- Create enum for budget status
CREATE TYPE public.budget_status AS ENUM ('borrador', 'publicado');

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type public.budget_type NOT NULL,
  iva_enabled BOOLEAN NOT NULL DEFAULT true,
  status public.budget_status NOT NULL DEFAULT 'borrador',
  version INTEGER NOT NULL DEFAULT 1,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Create budget_items table
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  mayor_id UUID REFERENCES public.tu_nodes(id),
  partida_id UUID REFERENCES public.tu_nodes(id),
  subpartida_id UUID REFERENCES public.tu_nodes(id),
  descripcion TEXT,
  unidad TEXT NOT NULL,
  cant_real NUMERIC NOT NULL DEFAULT 0,
  desperdicio_pct NUMERIC NOT NULL DEFAULT 0,
  cant_necesaria NUMERIC GENERATED ALWAYS AS (cant_real * (1 + desperdicio_pct / 100)) STORED,
  costo_unit NUMERIC NOT NULL DEFAULT 0,
  honorarios_pct NUMERIC NOT NULL DEFAULT 0,
  precio_unit NUMERIC GENERATED ALWAYS AS (costo_unit * (1 + honorarios_pct / 100)) STORED,
  total NUMERIC GENERATED ALWAYS AS (cant_real * (1 + desperdicio_pct / 100) * costo_unit * (1 + honorarios_pct / 100)) STORED,
  proveedor_alias TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_budgets_project ON public.budgets(project_id);
CREATE INDEX idx_budgets_status ON public.budgets(status);
CREATE INDEX idx_budget_items_budget ON public.budget_items(budget_id);
CREATE INDEX idx_budget_items_mayor ON public.budget_items(mayor_id);
CREATE INDEX idx_budget_items_partida ON public.budget_items(partida_id);

-- Add trigger for budgets updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate budget subtotals
CREATE OR REPLACE FUNCTION public.get_budget_subtotals(budget_id_param UUID)
RETURNS TABLE (
  mayor_id UUID,
  mayor_name TEXT,
  subtotal NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.mayor_id,
    tn.name as mayor_name,
    SUM(bi.total) as subtotal
  FROM public.budget_items bi
  LEFT JOIN public.tu_nodes tn ON tn.id = bi.mayor_id
  WHERE bi.budget_id = budget_id_param
  GROUP BY bi.mayor_id, tn.name
  ORDER BY MIN(bi.order_index);
END;
$$;