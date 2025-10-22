-- Create scope type enum
CREATE TYPE public.rule_scope_type AS ENUM ('global', 'sucursal', 'proyecto');

-- Create business rule sets table
CREATE TABLE public.business_rule_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business rules table
CREATE TABLE public.business_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_set_id UUID NOT NULL REFERENCES public.business_rule_sets(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  scope_type rule_scope_type NOT NULL DEFAULT 'global',
  scope_id UUID,
  active_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active_to TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rule_set_id, key, scope_type, scope_id)
);

-- Create audit table for rule changes
CREATE TABLE public.audit_rule_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.business_rules(id) ON DELETE CASCADE,
  old_value_json JSONB,
  new_value_json JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_rule_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Admins can view rule sets"
ON public.business_rule_sets FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rule sets"
ON public.business_rule_sets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view rules"
ON public.business_rules FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rules"
ON public.business_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view audit"
ON public.audit_rule_changes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for audit trail
CREATE OR REPLACE FUNCTION public.audit_rule_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.value_json IS DISTINCT FROM NEW.value_json THEN
    INSERT INTO public.audit_rule_changes (rule_id, old_value_json, new_value_json, changed_by)
    VALUES (NEW.id, OLD.value_json, NEW.value_json, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_rule_changes_trigger
AFTER UPDATE ON public.business_rules
FOR EACH ROW
EXECUTE FUNCTION public.audit_rule_change();

-- Create trigger for updated_at
CREATE TRIGGER update_business_rule_sets_updated_at
BEFORE UPDATE ON public.business_rule_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_rules_updated_at
BEFORE UPDATE ON public.business_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get effective rule value
CREATE OR REPLACE FUNCTION public.get_effective_rule(
  p_key TEXT,
  p_proyecto_id UUID DEFAULT NULL,
  p_sucursal_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule_set_id UUID;
  v_value JSONB;
BEGIN
  -- Get default rule set
  SELECT id INTO v_rule_set_id
  FROM public.business_rule_sets
  WHERE is_default = true
  LIMIT 1;

  -- Try proyecto-specific rule first (most specific)
  IF p_proyecto_id IS NOT NULL THEN
    SELECT value_json INTO v_value
    FROM public.business_rules
    WHERE rule_set_id = v_rule_set_id
      AND key = p_key
      AND scope_type = 'proyecto'
      AND scope_id = p_proyecto_id
      AND active_from <= now()
      AND (active_to IS NULL OR active_to > now())
    LIMIT 1;
    
    IF v_value IS NOT NULL THEN
      RETURN v_value;
    END IF;
  END IF;

  -- Try sucursal-specific rule (medium specific)
  IF p_sucursal_id IS NOT NULL THEN
    SELECT value_json INTO v_value
    FROM public.business_rules
    WHERE rule_set_id = v_rule_set_id
      AND key = p_key
      AND scope_type = 'sucursal'
      AND scope_id = p_sucursal_id
      AND active_from <= now()
      AND (active_to IS NULL OR active_to > now())
    LIMIT 1;
    
    IF v_value IS NOT NULL THEN
      RETURN v_value;
    END IF;
  END IF;

  -- Fall back to global rule (least specific)
  SELECT value_json INTO v_value
  FROM public.business_rules
  WHERE rule_set_id = v_rule_set_id
    AND key = p_key
    AND scope_type = 'global'
    AND active_from <= now()
    AND (active_to IS NULL OR active_to > now())
  LIMIT 1;

  RETURN v_value;
END;
$$;

-- Insert default rule set
INSERT INTO public.business_rule_sets (name, description, is_default)
VALUES ('Default Rules', 'Conjunto de reglas por defecto del sistema', true);

-- Insert default rules
WITH default_set AS (
  SELECT id FROM public.business_rule_sets WHERE is_default = true LIMIT 1
)
INSERT INTO public.business_rules (rule_set_id, key, value_json, scope_type)
SELECT 
  default_set.id,
  rule.key,
  rule.value_json::jsonb,
  'global'::rule_scope_type
FROM default_set, (VALUES
  ('pricing.variance_threshold_pct', '{"threshold": 0.05}'),
  ('consumption.near_completion_threshold_pct', '{"threshold": 0.80}'),
  ('gantt.deadline_warning_days', '{"warning_days": 5}'),
  ('budget.default_iva_enabled', '{"enabled": true}'),
  ('commissions.alliance.percent', '{"default_percent": 0.02}'),
  ('commissions.collaborator.percent', '{"arquitectura": 0.03, "construccion": 0.02}'),
  ('docs.required_list.arq', '{"items": ["INE", "CSF", "CURP", "ComprobanteDomicilio", "WishlistFirmado", "ContratoArquitectonico"]}'),
  ('docs.required_list.ejec', '{"items": ["MecánicaSuelos", "CálculoEstructural", "PermisoConstrucción", "DictamenProteccionCivil"]}'),
  ('alerts.channels', '{"email": true, "in_app": true, "whatsapp": false}'),
  ('finance.oc_grouping_enabled', '{"enabled": true}')
) AS rule(key, value_json);