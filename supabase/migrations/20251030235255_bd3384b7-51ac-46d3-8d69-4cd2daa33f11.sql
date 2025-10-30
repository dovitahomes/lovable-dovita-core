-- Vista de consumo por subpartida (sin tablas nuevas)
DROP VIEW IF EXISTS public.v_budget_consumption;

CREATE VIEW public.v_budget_consumption AS
SELECT
  b.project_id,
  bi.budget_id,
  bi.subpartida_id,
  COALESCE(SUM(bi.cant_necesaria), 0)               AS qty_planned,
  COALESCE(SUM(po.qty_solicitada), 0)               AS qty_solicitada,
  COALESCE(SUM(po.qty_ordenada), 0)                 AS qty_ordenada,
  COALESCE(SUM(po.qty_recibida), 0)                 AS qty_recibida,
  CASE
    WHEN COALESCE(SUM(bi.cant_necesaria), 0) = 0 THEN 0
    ELSE LEAST(
      COALESCE(SUM(po.qty_recibida), 0) / NULLIF(SUM(bi.cant_necesaria), 0),
      1
    )
  END                                               AS pct_consumida
FROM public.budget_items bi
JOIN public.budgets b
  ON b.id = bi.budget_id
LEFT JOIN public.purchase_orders po
  ON po.project_id = b.project_id
 AND po.subpartida_id = bi.subpartida_id
GROUP BY 1,2,3;