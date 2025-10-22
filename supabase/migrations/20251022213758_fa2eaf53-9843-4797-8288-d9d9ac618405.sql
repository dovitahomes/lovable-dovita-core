-- Add fields to budgets table for executive budget features
ALTER TABLE public.budgets
  ADD COLUMN is_template BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN template_name TEXT,
  ADD COLUMN shared_with_construction BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN cliente_view_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create budget_templates table
CREATE TABLE public.budget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type public.budget_type NOT NULL,
  items JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_attachments table for quotations
CREATE TABLE public.budget_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_config table
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variance_threshold_pct NUMERIC NOT NULL DEFAULT 5.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing config
INSERT INTO public.pricing_config (variance_threshold_pct) VALUES (5.0);

-- Create indexes
CREATE INDEX idx_budget_templates_type ON public.budget_templates(type);
CREATE INDEX idx_budget_attachments_item ON public.budget_attachments(budget_item_id);

-- Function to check price variance
CREATE OR REPLACE FUNCTION public.check_price_variance(
  subpartida_id_param UUID,
  new_price NUMERIC
)
RETURNS TABLE (
  has_variance BOOLEAN,
  previous_price NUMERIC,
  variance_pct NUMERIC,
  threshold_pct NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  prev_price NUMERIC;
  threshold NUMERIC;
  variance NUMERIC;
BEGIN
  -- Get threshold
  SELECT variance_threshold_pct INTO threshold FROM public.pricing_config LIMIT 1;
  
  -- Get most recent price
  SELECT precio_unit INTO prev_price
  FROM public.price_history
  WHERE subpartida_id = subpartida_id_param
  ORDER BY observed_at DESC
  LIMIT 1;
  
  -- Calculate variance
  IF prev_price IS NOT NULL AND prev_price > 0 THEN
    variance := ABS((new_price - prev_price) / prev_price * 100);
    
    RETURN QUERY SELECT 
      variance > threshold,
      prev_price,
      variance,
      threshold;
  ELSE
    RETURN QUERY SELECT 
      false,
      NULL::NUMERIC,
      NULL::NUMERIC,
      threshold;
  END IF;
END;
$$;

-- Function to save price to history
CREATE OR REPLACE FUNCTION public.save_price_history(
  subpartida_id_param UUID,
  precio_param NUMERIC,
  unidad_param TEXT,
  proveedor_param TEXT DEFAULT NULL,
  source_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.price_history (
    subpartida_id,
    precio_unit,
    unidad,
    proveedor_id,
    source
  ) VALUES (
    subpartida_id_param,
    precio_param,
    unidad_param,
    NULL, -- proveedor_id for future use
    COALESCE(source_param, proveedor_param)
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;