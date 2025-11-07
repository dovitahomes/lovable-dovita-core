-- Create commission_rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_type TEXT,
  product TEXT,
  percent NUMERIC(5,2) NOT NULL,
  applies_on TEXT CHECK (applies_on IN ('cierre','pago')) DEFAULT 'cierre',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at on commission_rules
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for commission summary
CREATE OR REPLACE VIEW public.v_commission_summary AS
SELECT 
  c.id,
  c.deal_ref as project_id,
  p.client_id,
  cl.name as client_name,
  c.sujeto_id,
  CASE 
    WHEN c.tipo = 'alianza' THEN a.nombre
    WHEN c.tipo = 'colaborador' THEN u.full_name
    ELSE 'Desconocido'
  END as collaborator_name,
  c.tipo,
  c.percent,
  c.base_amount,
  c.calculated_amount as commission_amount,
  c.status,
  c.notes,
  c.created_at,
  c.paid_at
FROM public.commissions c
LEFT JOIN public.projects p ON c.deal_ref = p.id
LEFT JOIN public.clients cl ON p.client_id = cl.id
LEFT JOIN public.alianzas a ON c.sujeto_id = a.id AND c.tipo = 'alianza'
LEFT JOIN public.profiles u ON c.sujeto_id = u.id AND c.tipo = 'colaborador'
ORDER BY c.created_at DESC;

-- Create function to generate commissions on project close
CREATE OR REPLACE FUNCTION public.generate_commissions_on_close()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_total_amount NUMERIC;
BEGIN
  -- Get total contract amount from the latest published budget
  SELECT COALESCE(SUM(bi.total), 0) INTO v_total_amount
  FROM public.budgets b
  JOIN public.budget_items bi ON b.id = bi.budget_id
  WHERE b.project_id = NEW.id
    AND b.type = 'ejecutivo'
    AND b.status = 'publicado'
  ORDER BY b.created_at DESC
  LIMIT 1;

  -- Generate commissions for active rules that apply on 'cierre'
  FOR v_rule IN 
    SELECT * FROM public.commission_rules 
    WHERE active = true AND applies_on = 'cierre'
  LOOP
    -- Generate commission for each project collaborator
    INSERT INTO public.commissions (
      deal_ref, 
      sujeto_id, 
      tipo, 
      percent, 
      base_amount, 
      calculated_amount,
      status,
      notes
    )
    SELECT 
      NEW.id,
      pc.user_id,
      'colaborador'::commission_type,
      v_rule.percent,
      v_total_amount,
      v_total_amount * (v_rule.percent / 100),
      'calculada'::commission_status,
      'Generada automáticamente por regla: ' || v_rule.name
    FROM public.project_collaborators pc
    WHERE pc.project_id = NEW.id
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trg_commissions_close ON public.projects;
CREATE TRIGGER trg_commissions_close
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (NEW.status = 'cerrado' AND OLD.status IS DISTINCT FROM 'cerrado')
  EXECUTE FUNCTION public.generate_commissions_on_close();