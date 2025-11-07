-- ========================================
-- Tabla budget_audit para versionado y alertas de variación
-- ========================================

create table if not exists public.budget_audit (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete cascade,
  item_id uuid,
  field text not null,
  old_value numeric(14,2),
  new_value numeric(14,2),
  variation_percent numeric(6,2),
  created_at timestamptz default now()
);

-- ========================================
-- Vista v_budget_history para reportes y alertas
-- ========================================

create or replace view public.v_budget_history as
select 
  b.id as budget_id,
  b.project_id,
  b.type,
  b.version,
  b.status,
  b.created_at,
  p.client_id,
  count(distinct bi.id) as total_items,
  sum(bi.total) as budget_total,
  count(distinct case when a.variation_percent > 5 then a.id end) as alerts_over_5
from public.budgets b
left join public.projects p on p.id = b.project_id
left join public.budget_items bi on bi.budget_id = b.id
left join public.budget_audit a on a.budget_id = b.id and a.variation_percent > 5
group by b.id, b.project_id, b.type, b.version, b.status, b.created_at, p.client_id;

-- ========================================
-- RLS: Solo documentar, no implementar aún
-- Colaboradores asignados → lectura/escritura de presupuestos del proyecto
-- Clientes → solo lectura de la versión final (ejecutivo)
-- ========================================

comment on table public.budget_audit is 'Auditoría de cambios en presupuestos. RLS pendiente: colaboradores asignados pueden ver/editar, clientes solo lectura de ejecutivo';
comment on view public.v_budget_history is 'Histórico de presupuestos con contador de alertas de variación > 5%';