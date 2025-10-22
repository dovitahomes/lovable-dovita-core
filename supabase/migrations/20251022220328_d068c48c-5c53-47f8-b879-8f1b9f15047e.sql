-- Create commission enums
CREATE TYPE public.commission_type AS ENUM ('alianza', 'colaborador');
CREATE TYPE public.commission_status AS ENUM ('calculada', 'pendiente', 'pagada');

-- Create commissions table
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo commission_type NOT NULL,
  sujeto_id UUID NOT NULL,
  deal_ref UUID NOT NULL,
  base_amount NUMERIC NOT NULL,
  percent NUMERIC NOT NULL,
  calculated_amount NUMERIC GENERATED ALWAYS AS (base_amount * percent / 100) STORED,
  status commission_status NOT NULL DEFAULT 'calculada',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission config table
CREATE TABLE public.commission_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alliance_percent NUMERIC NOT NULL DEFAULT 5.0,
  collaborator_architecture_percent NUMERIC NOT NULL DEFAULT 3.0,
  collaborator_construction_percent NUMERIC NOT NULL DEFAULT 2.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.commission_config (alliance_percent, collaborator_architecture_percent, collaborator_construction_percent)
VALUES (5.0, 3.0, 2.0);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commissions (only admins can access)
CREATE POLICY "Admins can view all commissions"
ON public.commissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage commissions"
ON public.commissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for commission_config
CREATE POLICY "Admins can view commission config"
ON public.commission_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage commission config"
ON public.commission_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();