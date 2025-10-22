-- Create enum for project scope
CREATE TYPE public.project_scope AS ENUM ('global', 'sucursal', 'proyecto');

-- Create enum for node type
CREATE TYPE public.node_type AS ENUM ('departamento', 'mayor', 'partida', 'subpartida');

-- Create tu_nodes table
CREATE TABLE public.tu_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_scope public.project_scope NOT NULL DEFAULT 'global',
  scope_id UUID, -- NULL for global, sucursal_id or project_id for scoped
  type public.node_type NOT NULL,
  parent_id UUID REFERENCES public.tu_nodes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  unit_default TEXT,
  is_universal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code, project_scope, scope_id)
);

-- Create price_history table
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subpartida_id UUID REFERENCES public.tu_nodes(id) ON DELETE CASCADE NOT NULL,
  proveedor_id UUID, -- Future FK to suppliers
  unidad TEXT NOT NULL,
  precio_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tu_nodes_parent ON public.tu_nodes(parent_id);
CREATE INDEX idx_tu_nodes_scope ON public.tu_nodes(project_scope, scope_id);
CREATE INDEX idx_tu_nodes_type ON public.tu_nodes(type);
CREATE INDEX idx_tu_nodes_code ON public.tu_nodes(code);
CREATE INDEX idx_price_history_subpartida ON public.price_history(subpartida_id);

-- Add trigger for tu_nodes updated_at
CREATE TRIGGER update_tu_nodes_updated_at
  BEFORE UPDATE ON public.tu_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get full code path
CREATE OR REPLACE FUNCTION public.get_full_code(node_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  full_code TEXT := '';
  current_node RECORD;
  node_codes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get current node and traverse up
  FOR current_node IN 
    WITH RECURSIVE node_path AS (
      SELECT id, code, parent_id, is_universal
      FROM public.tu_nodes
      WHERE id = node_id
      
      UNION ALL
      
      SELECT n.id, n.code, n.parent_id, n.is_universal
      FROM public.tu_nodes n
      INNER JOIN node_path np ON n.id = np.parent_id
    )
    SELECT code, is_universal FROM node_path ORDER BY id DESC
  LOOP
    node_codes := array_append(node_codes, current_node.code);
  END LOOP;
  
  full_code := array_to_string(node_codes, '.');
  RETURN full_code;
END;
$$;