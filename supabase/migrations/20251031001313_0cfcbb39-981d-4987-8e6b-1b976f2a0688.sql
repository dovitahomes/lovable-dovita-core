-- Vista para totales por mayor del presupuesto ejecutivo más reciente
DROP VIEW IF EXISTS public.v_project_exec_budget_mayor_totals;

CREATE VIEW public.v_project_exec_budget_mayor_totals AS
WITH latest_exec AS (
  SELECT DISTINCT ON (project_id)
    id AS budget_id, project_id, published_at, version
  FROM public.budgets
  WHERE type = 'ejecutivo' AND status = 'publicado'
  ORDER BY project_id, published_at DESC NULLS LAST, version DESC
),
majors AS (
  SELECT 
    b.project_id,
    b.id AS budget_id,
    bi.mayor_id,
    tn.name AS mayor_name,
    SUM(bi.total) AS importe
  FROM public.budgets b
  JOIN latest_exec le ON le.budget_id = b.id
  JOIN public.budget_items bi ON bi.budget_id = b.id
  LEFT JOIN public.tu_nodes tn ON tn.id = bi.mayor_id
  GROUP BY b.project_id, b.id, bi.mayor_id, tn.name
),
tot AS (
  SELECT project_id, budget_id, SUM(importe) AS total_budget
  FROM majors
  GROUP BY project_id, budget_id
)
SELECT 
  m.project_id,
  m.budget_id,
  m.mayor_id,
  m.mayor_name,
  m.importe,
  t.total_budget,
  CASE WHEN t.total_budget > 0 THEN ROUND((m.importe / t.total_budget) * 100, 2) ELSE 0 END AS pct_of_total
FROM majors m
JOIN tot t USING (project_id, budget_id);

-- Agregar columnas para porcentajes en ministraciones
ALTER TABLE public.gantt_ministrations
  ADD COLUMN IF NOT EXISTS percent numeric(5,2),
  ADD COLUMN IF NOT EXISTS accumulated_percent numeric(5,2);