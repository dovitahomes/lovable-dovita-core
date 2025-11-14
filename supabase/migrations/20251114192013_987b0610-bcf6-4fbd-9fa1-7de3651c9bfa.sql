
-- Create v_client_project_summary view with correct column names
DROP VIEW IF EXISTS public.v_client_project_summary;

CREATE OR REPLACE VIEW public.v_client_project_summary
WITH (security_invoker = false)
AS
SELECT 
  p.id AS project_id,
  p.project_name,
  p.status AS project_status,
  p.notas AS project_description,
  p.created_at,
  p.updated_at,
  c.name AS client_name,
  c.email AS client_email,
  
  -- Progress (usa override si existe, sino calcula)
  COALESCE(
    p.progress_override,
    public.calculate_project_progress(p.id)
  ) AS progress,
  
  -- Budget total (presupuesto ejecutivo publicado)
  (
    SELECT COALESCE(SUM(bi.total), 0)
    FROM public.budget_items bi
    JOIN public.budgets b ON b.id = bi.budget_id
    WHERE b.project_id = p.id
      AND b.type = 'ejecutivo'
      AND b.status = 'publicado'
  ) AS total_budget,
  
  -- Ministrations paid/pending count
  (
    SELECT COUNT(*)
    FROM public.gantt_ministrations gm
    JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
    LEFT JOIN public.invoices i ON i.id = gm.invoice_id
    WHERE gp.project_id = p.id
      AND i.paid = true
  ) AS paid_ministrations,
  
  (
    SELECT COUNT(*)
    FROM public.gantt_ministrations gm
    JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
    LEFT JOIN public.invoices i ON i.id = gm.invoice_id
    WHERE gp.project_id = p.id
      AND (i.paid IS NULL OR i.paid = false)
  ) AS pending_ministrations,
  
  -- Next event date (usando start_time)
  (
    SELECT MIN(DATE(pe.start_time))
    FROM public.project_events pe
    WHERE pe.project_id = p.id
      AND DATE(pe.start_time) >= CURRENT_DATE
  ) AS next_event_date,
  
  -- Team size
  (
    SELECT COUNT(DISTINCT pc.user_id)
    FROM public.project_collaborators pc
    WHERE pc.project_id = p.id
  ) AS team_size
  
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id;

-- Grant permissions
GRANT SELECT ON public.v_client_project_summary TO authenticated;

COMMENT ON VIEW public.v_client_project_summary IS 'Vista segura para Client App: resumen completo del proyecto con progreso calculado, presupuesto, ministraciones y próximo evento.';
