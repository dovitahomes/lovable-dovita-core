-- Create view for client financial summary by project
CREATE OR REPLACE VIEW public.vw_client_financial_summary AS
WITH project_deposits AS (
  SELECT 
    t.project_id,
    COALESCE(SUM(t.amount), 0) as total_deposits
  FROM public.transactions t
  WHERE t.type = 'ingreso'
    AND t.project_id IS NOT NULL
  GROUP BY t.project_id
),
project_expenses AS (
  SELECT 
    po.project_id,
    bi.mayor_id,
    tn.code as mayor_code,
    tn.name as mayor_name,
    COALESCE(SUM(po.qty_recibida * bi.precio_unit), 0) as total_expense
  FROM public.purchase_orders po
  JOIN public.budget_items bi ON bi.subpartida_id = po.subpartida_id
  JOIN public.budgets b ON b.id = bi.budget_id
  JOIN public.tu_nodes tn ON tn.id = bi.mayor_id
  WHERE po.project_id = b.project_id
    AND po.estado = 'recibido'
  GROUP BY po.project_id, bi.mayor_id, tn.code, tn.name
),
project_totals AS (
  SELECT 
    pe.project_id,
    COALESCE(SUM(pe.total_expense), 0) as total_expenses
  FROM project_expenses pe
  GROUP BY pe.project_id
)
SELECT 
  p.id as project_id,
  p.client_id,
  c.name as client_name,
  COALESCE(pd.total_deposits, 0) as total_deposits,
  COALESCE(pt.total_expenses, 0) as total_expenses,
  COALESCE(pd.total_deposits, 0) - COALESCE(pt.total_expenses, 0) as balance,
  pe.mayor_id,
  pe.mayor_code,
  pe.mayor_name,
  COALESCE(pe.total_expense, 0) as mayor_expense
FROM public.projects p
JOIN public.clients c ON c.id = p.client_id
LEFT JOIN project_deposits pd ON pd.project_id = p.id
LEFT JOIN project_totals pt ON pt.project_id = p.id
LEFT JOIN project_expenses pe ON pe.project_id = p.id;

-- Grant access to view
GRANT SELECT ON public.vw_client_financial_summary TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.vw_client_financial_summary SET (security_invoker = true);