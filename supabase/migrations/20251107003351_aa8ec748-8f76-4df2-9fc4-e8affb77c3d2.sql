-- ========================================
-- Tabla construction_stages: Etapas de construcción
-- ========================================

create table if not exists public.construction_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  progress numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- Tabla materials_consumption: Consumo de materiales
-- ========================================

create table if not exists public.materials_consumption (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references public.construction_stages(id) on delete cascade,
  budget_item_id uuid references public.budget_items(id),
  quantity_used numeric(14,2) default 0,
  unit_cost numeric(14,2) not null,
  total numeric(14,2) generated always as (quantity_used * unit_cost) stored,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ========================================
-- Vista v_construction_progress: Progreso con alertas al 80%
-- ========================================

create or replace view public.v_construction_progress as
select
  s.id as stage_id,
  s.project_id,
  s.name,
  s.start_date,
  s.end_date,
  s.progress,
  coalesce(sum(c.quantity_used * c.unit_cost), 0) as total_consumed,
  coalesce(sum(bi.total), 0) as total_budgeted,
  case
    when coalesce(sum(bi.total), 0) > 0 then
      (coalesce(sum(c.quantity_used * c.unit_cost), 0) / coalesce(sum(bi.total), 0) * 100)
    else 0
  end as consumption_pct,
  case
    when coalesce(sum(bi.total), 0) > 0 and
         coalesce(sum(c.quantity_used * c.unit_cost), 0) >= 0.8 * coalesce(sum(bi.total), 0)
    then true 
    else false 
  end as alert_80
from public.construction_stages s
left join public.materials_consumption c on s.id = c.stage_id
left join public.budget_items bi on c.budget_item_id = bi.id
group by s.id, s.project_id, s.name, s.start_date, s.end_date, s.progress;

-- ========================================
-- Trigger para actualizar updated_at
-- ========================================

create trigger update_construction_stages_updated_at
  before update on public.construction_stages
  for each row
  execute function public.update_updated_at_column();

-- ========================================
-- RLS: Solo documentar, no implementar aún
-- Clientes → solo lectura de progreso y consumo
-- Colaboradores asignados → lectura y escritura en materials_consumption y purchase_orders
-- Solo jefes de proyecto → editar construction_stages
-- ========================================

comment on table public.construction_stages is 'Etapas de construcción. RLS pendiente: clientes READ, colaboradores READ/WRITE, jefes proyecto FULL';
comment on table public.materials_consumption is 'Consumo de materiales por etapa. RLS pendiente: clientes READ, colaboradores asignados READ/WRITE';
comment on view public.v_construction_progress is 'Vista de progreso con alertas automáticas al 80% de consumo';