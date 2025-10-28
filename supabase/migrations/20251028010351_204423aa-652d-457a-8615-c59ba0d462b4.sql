-- Create view for sales funnel KPI
CREATE OR REPLACE VIEW public.vw_kpi_sales_funnel AS
SELECT 
  status,
  COUNT(*) as count
FROM public.leads
GROUP BY status;

-- Create view for pipeline value KPI
CREATE OR REPLACE VIEW public.vw_kpi_pipeline_value AS
SELECT 
  COALESCE(SUM(presupuesto_referencia), 0) as total_pipeline
FROM public.leads
WHERE status IN ('nuevo', 'contactado', 'calificado');

-- Create view for accounts payable/receivable KPI
CREATE OR REPLACE VIEW public.vw_kpi_ap_ar AS
SELECT 
  COALESCE(SUM(CASE WHEN tipo = 'ingreso' AND paid = false THEN total_amount ELSE 0 END), 0) as total_cobrar,
  COALESCE(SUM(CASE WHEN tipo = 'egreso' AND paid = false THEN total_amount ELSE 0 END), 0) as total_pagar
FROM public.invoices;

-- Create view for project progress KPI (simplified - based on updated_at recency)
CREATE OR REPLACE VIEW public.vw_kpi_project_progress AS
SELECT 
  p.id as project_id,
  c.name as client_name,
  p.updated_at,
  COALESCE(
    (SELECT COUNT(DISTINCT gi.major_id) * 100.0 / NULLIF(
      (SELECT COUNT(DISTINCT major_id) FROM public.gantt_items WHERE gantt_id = gp.id), 0
    )
    FROM public.gantt_items gi
    WHERE gi.gantt_id = gp.id AND gi.end_date < CURRENT_DATE), 
    0
  ) as progress_pct
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id
LEFT JOIN public.gantt_plans gp ON gp.project_id = p.id
WHERE p.status = 'activo'
ORDER BY p.updated_at DESC
LIMIT 10;

-- Grant permissions
GRANT SELECT ON public.vw_kpi_sales_funnel TO authenticated;
GRANT SELECT ON public.vw_kpi_pipeline_value TO authenticated;
GRANT SELECT ON public.vw_kpi_ap_ar TO authenticated;
GRANT SELECT ON public.vw_kpi_project_progress TO authenticated;